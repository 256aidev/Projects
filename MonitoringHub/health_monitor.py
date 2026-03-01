#!/usr/bin/env python
"""
Health Monitoring System
Monitors application endpoints and automatically restarts failed services.
"""

import sys
import json
import logging
import time
import subprocess
from datetime import datetime
from pathlib import Path
from logging.handlers import RotatingFileHandler

try:
    import requests
except ImportError:
    print("ERROR: requests library not installed. Run: python -m pip install requests")
    sys.exit(1)


class HealthMonitor:
    def __init__(self, config_path="apps_config.json"):
        """Initialize the health monitor with configuration."""
        self.config_path = Path(config_path)
        self.config = self.load_config()
        self.setup_logging()

    def load_config(self):
        """Load configuration from JSON file."""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)

            # Validate config
            required_keys = ['apps', 'check_interval_seconds', 'log_file']
            for key in required_keys:
                if key not in config:
                    raise ValueError(f"Missing required config key: {key}")

            return config
        except FileNotFoundError:
            print(f"ERROR: Configuration file not found: {self.config_path}")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in configuration file: {e}")
            sys.exit(1)
        except Exception as e:
            print(f"ERROR: Failed to load configuration: {e}")
            sys.exit(1)

    def setup_logging(self):
        """Set up logging with rotation to prevent huge log files."""
        log_file = Path(self.config['log_file'])
        log_file.parent.mkdir(parents=True, exist_ok=True)

        # Create rotating file handler (10MB max, keep 5 backups)
        handler = RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )

        # Set format
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        handler.setFormatter(formatter)

        # Configure root logger
        self.logger = logging.getLogger('HealthMonitor')
        self.logger.setLevel(logging.INFO)
        self.logger.addHandler(handler)

        # Also log to console
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

    def check_health(self, app):
        """
        Check health of a single application endpoint.

        Returns:
            tuple: (success: bool, message: str, status_code: int or None)
        """
        name = app['name']
        url = app['health_url']
        timeout = app.get('timeout', 10)

        try:
            response = requests.get(url, timeout=timeout, verify=True)

            if response.status_code == 200:
                return True, "OK", response.status_code
            else:
                return False, f"HTTP {response.status_code}", response.status_code

        except requests.exceptions.Timeout:
            return False, f"Timeout after {timeout}s", None
        except requests.exceptions.ConnectionError:
            return False, "Connection refused", None
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", None
        except Exception as e:
            return False, f"Unexpected error: {str(e)}", None

    def restart_service(self, app):
        """
        Attempt to restart a failed service.

        Returns:
            tuple: (success: bool, message: str)
        """
        restart_cmd = app.get('restart_cmd')
        if not restart_cmd:
            return False, "No restart command configured"

        name = app['name']
        self.logger.warning(f"Attempting to restart {name}: {restart_cmd}")

        try:
            # Run restart command with elevated privileges
            result = subprocess.run(
                restart_cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                self.logger.info(f"Successfully restarted {name}")
                return True, "Service restarted successfully"
            else:
                error_msg = result.stderr.strip() or result.stdout.strip()
                self.logger.error(f"Failed to restart {name}: {error_msg}")
                return False, f"Restart failed: {error_msg}"

        except subprocess.TimeoutExpired:
            self.logger.error(f"Restart command timed out for {name}")
            return False, "Restart command timed out"
        except PermissionError:
            self.logger.error(f"Permission denied when restarting {name}. Run as administrator.")
            return False, "Permission denied - need administrator rights"
        except Exception as e:
            self.logger.error(f"Error restarting {name}: {str(e)}")
            return False, f"Restart error: {str(e)}"

    def check_all_apps(self):
        """Check health of all configured applications."""
        self.logger.info("=" * 60)
        self.logger.info("Starting health check cycle")

        for app in self.config['apps']:
            name = app['name']
            success, message, status_code = self.check_health(app)

            if success:
                self.logger.info(f"[OK] {name}: {message}")
            else:
                self.logger.error(f"[FAIL] {name}: {message}")

                # Attempt restart if configured
                if app.get('restart_cmd'):
                    restart_success, restart_msg = self.restart_service(app)

                    # Verify restart worked
                    if restart_success:
                        time.sleep(5)  # Wait for service to start
                        verify_success, verify_msg, _ = self.check_health(app)
                        if verify_success:
                            self.logger.info(f"[RECOVERED] {name}: Service is now healthy")
                        else:
                            self.logger.error(f"[STILL DOWN] {name}: Service restarted but still unhealthy")

    def run_once(self):
        """Run a single health check cycle."""
        self.logger.info("Running single health check...")
        self.check_all_apps()
        self.logger.info("Single check completed")

    def run_continuous(self):
        """Run continuous health monitoring."""
        interval = self.config['check_interval_seconds']
        self.logger.info(f"Starting continuous health monitoring (interval: {interval}s)")
        self.logger.info(f"Monitoring {len(self.config['apps'])} applications")

        try:
            while True:
                self.check_all_apps()
                self.logger.info(f"Sleeping for {interval} seconds...")
                time.sleep(interval)
        except KeyboardInterrupt:
            self.logger.info("Monitoring stopped by user (Ctrl+C)")
        except Exception as e:
            self.logger.error(f"Fatal error in monitoring loop: {e}")
            raise


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description='Health Monitoring System')
    parser.add_argument('--single-run', action='store_true',
                        help='Run a single check and exit (for testing)')
    parser.add_argument('--config', default='apps_config.json',
                        help='Path to configuration file (default: apps_config.json)')

    args = parser.parse_args()

    # Initialize monitor
    monitor = HealthMonitor(config_path=args.config)

    # Run based on mode
    if args.single_run:
        monitor.run_once()
    else:
        monitor.run_continuous()


if __name__ == '__main__':
    main()
