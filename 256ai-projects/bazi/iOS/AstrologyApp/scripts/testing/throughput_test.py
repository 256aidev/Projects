#!/usr/bin/env python3
"""
Throughput Test Script

Tests concurrent API requests and measures performance metrics.
Usage: python throughput_test.py [--concurrency 10] [--requests 100]
"""

import sys
import os
import argparse
import time
import random
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    sys.exit(1)

from models import get_db, User

# API base URL
API_BASE = os.getenv("API_BASE", "http://localhost:8000")


def get_test_user_ids(db, limit=100):
    """Get test user IDs."""
    users = db.query(User.id).filter(User.auth_provider == "test").limit(limit).all()
    if not users:
        users = db.query(User.id).filter(User.id > 3).limit(limit).all()
    return [u.id for u in users]


def make_request(user_id, endpoint_type, timeout=120):
    """Make a single API request and return timing info."""
    endpoints = {
        "daily": f"{API_BASE}/daily/{user_id}",
        "weekly": f"{API_BASE}/weekly/{user_id}",
        "monthly": f"{API_BASE}/monthly/{user_id}",
        "yearly": f"{API_BASE}/yearly/{user_id}",
        "health": f"{API_BASE}/health",
    }

    url = endpoints.get(endpoint_type, endpoints["daily"])

    try:
        start = time.time()
        response = requests.get(url, timeout=timeout)
        elapsed = time.time() - start

        return {
            "user_id": user_id,
            "endpoint": endpoint_type,
            "status_code": response.status_code,
            "latency": elapsed,
            "success": response.status_code == 200,
            "error": None,
        }
    except requests.exceptions.Timeout:
        return {
            "user_id": user_id,
            "endpoint": endpoint_type,
            "status_code": 0,
            "latency": timeout,
            "success": False,
            "error": "Timeout",
        }
    except Exception as e:
        return {
            "user_id": user_id,
            "endpoint": endpoint_type,
            "status_code": 0,
            "latency": 0,
            "success": False,
            "error": str(e),
        }


def run_throughput_test(user_ids, concurrency=10, total_requests=100, endpoint_type="daily"):
    """Run concurrent requests and measure throughput."""
    print(f"\n{'='*70}")
    print(f"Throughput Test: {endpoint_type.upper()}")
    print(f"{'='*70}")
    print(f"Concurrency: {concurrency}")
    print(f"Total Requests: {total_requests}")
    print(f"Endpoint: {endpoint_type}")
    print(f"Users: {len(user_ids)}")
    print(f"{'='*70}\n")

    results = []
    start_time = time.time()

    # Create request list (cycle through users)
    request_list = []
    for i in range(total_requests):
        user_id = user_ids[i % len(user_ids)]
        request_list.append((user_id, endpoint_type))

    # Execute with thread pool
    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = []
        for user_id, etype in request_list:
            future = executor.submit(make_request, user_id, etype)
            futures.append(future)

        completed = 0
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            completed += 1

            # Progress indicator
            if completed % 10 == 0 or completed == total_requests:
                elapsed = time.time() - start_time
                rps = completed / elapsed if elapsed > 0 else 0
                print(f"  Progress: {completed}/{total_requests} ({rps:.1f} req/s)")

    total_time = time.time() - start_time

    # Calculate metrics
    successful = [r for r in results if r["success"]]
    failed = [r for r in results if not r["success"]]
    latencies = [r["latency"] for r in successful]

    metrics = {
        "total_requests": total_requests,
        "successful": len(successful),
        "failed": len(failed),
        "total_time": total_time,
        "requests_per_second": total_requests / total_time if total_time > 0 else 0,
        "success_rate": (len(successful) / total_requests * 100) if total_requests > 0 else 0,
    }

    if latencies:
        metrics["latency_avg"] = statistics.mean(latencies)
        metrics["latency_min"] = min(latencies)
        metrics["latency_max"] = max(latencies)
        metrics["latency_p50"] = statistics.median(latencies)
        metrics["latency_p95"] = sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) > 1 else latencies[0]
        metrics["latency_p99"] = sorted(latencies)[int(len(latencies) * 0.99)] if len(latencies) > 1 else latencies[0]

    return metrics, results


def print_metrics(metrics, endpoint_type):
    """Print formatted metrics."""
    print(f"\n{'='*70}")
    print(f"RESULTS: {endpoint_type.upper()}")
    print(f"{'='*70}")
    print(f"  Total Requests:     {metrics['total_requests']}")
    print(f"  Successful:         {metrics['successful']}")
    print(f"  Failed:             {metrics['failed']}")
    print(f"  Success Rate:       {metrics['success_rate']:.1f}%")
    print(f"  Total Time:         {metrics['total_time']:.2f}s")
    print(f"  Requests/Second:    {metrics['requests_per_second']:.2f}")

    if "latency_avg" in metrics:
        print(f"\n  Latency (seconds):")
        print(f"    Min:    {metrics['latency_min']:.3f}s")
        print(f"    Avg:    {metrics['latency_avg']:.3f}s")
        print(f"    P50:    {metrics['latency_p50']:.3f}s")
        print(f"    P95:    {metrics['latency_p95']:.3f}s")
        print(f"    P99:    {metrics['latency_p99']:.3f}s")
        print(f"    Max:    {metrics['latency_max']:.3f}s")

    print(f"{'='*70}\n")


def run_full_test_suite(user_ids, concurrency_levels, requests_per_level):
    """Run tests at multiple concurrency levels."""
    all_results = {}

    for conc in concurrency_levels:
        print(f"\n\n{'#'*70}")
        print(f"# TESTING CONCURRENCY LEVEL: {conc}")
        print(f"{'#'*70}")

        for etype in ["daily", "weekly"]:  # Test most common endpoints
            metrics, results = run_throughput_test(
                user_ids,
                concurrency=conc,
                total_requests=requests_per_level,
                endpoint_type=etype
            )
            print_metrics(metrics, etype)
            all_results[f"{etype}_c{conc}"] = metrics

    return all_results


def main():
    parser = argparse.ArgumentParser(description="Throughput test for BaZi API")
    parser.add_argument("--concurrency", "-c", type=int, default=10,
                        help="Number of concurrent requests")
    parser.add_argument("--requests", "-n", type=int, default=100,
                        help="Total number of requests")
    parser.add_argument("--endpoint", "-e", choices=["daily", "weekly", "monthly", "yearly", "health"],
                        default="daily", help="Endpoint to test")
    parser.add_argument("--api-base", type=str, default="http://localhost:8000",
                        help="API base URL")
    parser.add_argument("--full-suite", action="store_true",
                        help="Run full test suite with multiple concurrency levels")
    args = parser.parse_args()

    global API_BASE
    API_BASE = args.api_base

    db = next(get_db())
    user_ids = get_test_user_ids(db)

    if not user_ids:
        print("No test users found. Run seed_test_users.py first.")
        return

    print(f"\n{'='*70}")
    print(f"BaZi API Throughput Test")
    print(f"{'='*70}")
    print(f"API Base: {API_BASE}")
    print(f"Test Users: {len(user_ids)}")
    print(f"Timestamp: {datetime.now().isoformat()}")

    if args.full_suite:
        # Run at multiple concurrency levels
        concurrency_levels = [1, 5, 10, 25, 50]
        requests_per_level = 50
        all_results = run_full_test_suite(user_ids, concurrency_levels, requests_per_level)

        # Final summary
        print(f"\n\n{'='*70}")
        print(f"FULL SUITE SUMMARY")
        print(f"{'='*70}")
        print(f"{'Test':<25} {'RPS':>10} {'Success%':>10} {'Avg(s)':>10} {'P95(s)':>10}")
        print(f"{'-'*70}")
        for test_name, metrics in all_results.items():
            print(f"{test_name:<25} {metrics['requests_per_second']:>10.1f} "
                  f"{metrics['success_rate']:>9.1f}% "
                  f"{metrics.get('latency_avg', 0):>10.3f} "
                  f"{metrics.get('latency_p95', 0):>10.3f}")
        print(f"{'='*70}\n")

    else:
        # Run single test
        metrics, results = run_throughput_test(
            user_ids,
            concurrency=args.concurrency,
            total_requests=args.requests,
            endpoint_type=args.endpoint
        )
        print_metrics(metrics, args.endpoint)

        # Show errors if any
        errors = [r for r in results if r["error"]]
        if errors:
            print(f"\nErrors encountered ({len(errors)}):")
            for e in errors[:5]:  # Show first 5
                print(f"  User {e['user_id']}: {e['error']}")


if __name__ == "__main__":
    main()
