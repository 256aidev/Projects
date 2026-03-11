# ChoreQuest — On-Premises Deployment Guide

## Prerequisites

| Requirement | Minimum Version |
|-------------|----------------|
| Docker | 24.0+ |
| Docker Compose | v2.20+ (compose plugin) |
| Git | 2.30+ |
| Disk space | 2 GB free |
| RAM | 1 GB available |

Verify prerequisites:

```bash
docker --version
docker compose version
git --version
```

## First-Time Setup

### 1. Clone the repository

```bash
git clone <your-repo-url> /opt/chorequest
cd /opt/chorequest
```

### 2. Configure environment

```bash
cp infra/docker/.env.example infra/docker/.env
```

Edit `infra/docker/.env` and set secure values:

```env
POSTGRES_USER=chorequest
POSTGRES_PASSWORD=<generate-a-strong-password>
POSTGRES_DB=chorequest
CORS_ORIGIN=https://your-domain.local
HTTP_PORT=80
```

### 3. Build and start

```bash
cd infra/docker
docker compose up -d --build
```

### 4. Run initial migrations

```bash
cd ../../
./infra/scripts/migrate.sh
```

### 5. Verify

```bash
curl http://localhost/health
curl http://localhost/health/detailed
```

## Environment Variable Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `chorequest` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `chorequest_secret` | PostgreSQL password (**change in production**) |
| `POSTGRES_DB` | `chorequest` | Database name |
| `CORS_ORIGIN` | `*` | Allowed CORS origin(s) |
| `HTTP_PORT` | `80` | Host port for HTTP traffic |
| `HTTPS_PORT` | `443` | Host port for HTTPS (when SSL enabled) |
| `PORT` | `3000` | API internal port (rarely changed) |
| `NODE_ENV` | `production` | Node.js environment |

## SSL/TLS Certificate Setup

### Option A: Self-signed (internal/dev)

```bash
mkdir -p infra/docker/ssl
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout infra/docker/ssl/key.pem \
  -out infra/docker/ssl/cert.pem \
  -subj "/CN=chorequest.local"
```

### Option B: CA-signed certificate

Place your certificate files in `infra/docker/ssl/`:
- `cert.pem` — Full certificate chain
- `key.pem` — Private key

### Enable SSL in docker-compose.yml

1. Uncomment the HTTPS port mapping in `docker-compose.yml`:
   ```yaml
   - "${HTTPS_PORT:-443}:443"
   ```
2. Uncomment the SSL volume mount:
   ```yaml
   - ./ssl:/etc/nginx/ssl:ro
   ```
3. In `nginx.conf`, uncomment the SSL server block and the HTTP→HTTPS redirect.

4. Restart nginx:
   ```bash
   docker compose restart nginx
   ```

## Network Configuration

### Ports

| Service | Internal Port | Default External Port |
|---------|--------------|----------------------|
| nginx | 80/443 | 80/443 |
| API | 3000 | Not exposed (via nginx) |
| PostgreSQL | 5432 | Not exposed |

In production, only nginx is exposed. The API and database are on an internal Docker network (`chorequest`).

### Firewall

Open only the HTTP/HTTPS ports on your host firewall:

```bash
# Linux (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Windows
netsh advfirewall firewall add rule name="ChoreQuest HTTP" dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="ChoreQuest HTTPS" dir=in action=allow protocol=TCP localport=443
```

### DNS / hosts

For LAN access, either configure your router's DNS or add a hosts entry on client devices:

```
10.0.1.100  chorequest.local
```

## Development Setup

For local development with hot-reload and debug ports:

```bash
cd infra/docker
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This exposes:
- API at `localhost:3000` (direct, bypasses nginx)
- PostgreSQL at `localhost:5432` (for tools like pgAdmin)
- Debug port at `localhost:9229` (for Node.js debugger)
- nginx at `localhost:8080`
