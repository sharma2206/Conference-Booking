# DevOps Audit

**Date:** 2026-06-26

---

## Docker Architecture

### Services

| Service | Image | Status | Issues |
|---|---|---|---|
| app | PHP 8.3-FPM custom | ✅ | — |
| nginx | nginx:1.25-alpine | ✅ | — |
| mysql | mysql:8.0 | ✅ | No health check |
| redis | redis:7-alpine | ⚠️ | No persistence, no health check |
| queue | same as app | ✅ | Single queue worker image |
| scheduler | same as app | ✅ | — |

---

## Dockerfile Analysis

Multi-stage build detected ✅  
PHP 8.3-FPM base ✅  
Extensions: PDO, MySQL, GD, BCMath, Redis ✅

**Issues:**

**DO-01 (High): Redis no persistence**
```yaml
# Current docker-compose.yml — Redis service
redis:
  image: redis:7-alpine
  # No --appendonly flag, no volume for data
```
All rate limit counters, cached data, and session tokens are lost on Redis restart.

**Fix:**
```yaml
redis:
  image: redis:7-alpine
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 30s
    timeout: 10s
    retries: 3
```

**DO-02 (High): No MySQL health check**
The `app` service may start before MySQL is ready, causing connection errors on boot.

**Fix:**
```yaml
mysql:
  healthcheck:
    test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$$MYSQL_ROOT_PASSWORD"]
    interval: 30s
    timeout: 10s
    retries: 5

app:
  depends_on:
    mysql:
      condition: service_healthy
    redis:
      condition: service_healthy
```

**DO-03 (Medium): No named volumes declared**
Missing `volumes:` section at docker-compose root level.

**DO-04 (Medium): APP_KEY rotation not documented**
If `APP_KEY` is rotated, all encrypted data (if any) and signed URLs become invalid. No runbook for this.

**DO-05 (Low): No resource limits on containers**
No `mem_limit` or `cpus` set — a runaway queue job could consume all host memory.

---

## Nginx Configuration

- 20MB upload limit ✅
- Static asset caching (1 year) ✅
- PHP-FPM proxy ✅

**Issues:**

**DO-06 (High): No HTTPS in Nginx config**
`docker/nginx/default.conf` only configures HTTP on port 80. For production, HTTPS termination must be configured here or at load balancer level.

```nginx
# Missing in default.conf:
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
```

**DO-07 (Medium): No rate limiting in Nginx**
Application-level throttling exists but Nginx-level rate limiting would block abusive requests before they hit PHP.

```nginx
# Add to nginx.conf:
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;
```

---

## Supervisor Configuration

- PHP-FPM managed ✅
- `default` queue: 2 workers ✅  
- `notifications` queue: 1 worker ✅

**Issues:**

**DO-08 (Medium): No memory/timeout limits on workers**
```ini
# Current supervisord.conf (assumed):
command=php artisan queue:work redis

# Should be:
command=php artisan queue:work redis --queue=default --tries=3 --timeout=120 --memory=256 --max-jobs=500
```

`--max-jobs=500` prevents memory leaks by recycling workers every 500 jobs.

**DO-09 (Low): No worker restart on failure alert**
Supervisor restarts workers silently. No alert when a worker crashes repeatedly.

---

## CI/CD Pipeline

### `.github/workflows/ci.yml`

**Jobs:**
1. `test` — PHPUnit on Ubuntu + MySQL ✅
2. `lint` — Laravel Pint ✅
3. `build` — npm build ✅

**Missing:**

**DO-10 (Critical): No security audit step**
```yaml
- name: Composer security audit
  run: composer audit

- name: NPM security audit
  run: npm audit --audit-level=high
```

**DO-11 (High): No staging deployment step**
CI passes but there's no automatic deploy to staging. Developers must deploy manually.

**DO-12 (High): No deployment rollback strategy**
No `php artisan down` before deploy, no zero-downtime deployment (e.g. Laravel Envoyer, Blue-Green).

**DO-13 (Medium): Tests run on SQLite (in-memory)**
```yaml
# phpunit.xml — uses DB_CONNECTION=sqlite :memory:
```
SQLite behavior differs from MySQL 8 in:
- JSON column handling
- Date/time functions
- Strict mode behavior
Tests pass on SQLite but may fail on production MySQL.

**Fix:** Use a MySQL service container in CI (already referenced in ci.yml but confirm it's active).

---

## Backup Strategy

**DO-14 (Critical): No backup configuration**

No automated database backups in Docker Compose or CI/CD.

**Fix — Add backup service to docker-compose.yml:**
```yaml
backup:
  image: fradelg/mysql-cron-backup
  environment:
    - MYSQL_HOST=mysql
    - MYSQL_USER=${DB_USERNAME}
    - MYSQL_PASS=${DB_PASSWORD}
    - MYSQL_DB=${DB_DATABASE}
    - MAX_BACKUPS=14
    - INIT_BACKUP=1
    - CRON_TIME=0 2 * * *  # 2am daily
  volumes:
    - ./backups:/backup
  depends_on:
    - mysql
```

---

## Monitoring

**DO-15 (High): No application monitoring**

No APM integration (New Relic, Datadog, Sentry). A production crash is invisible until a user reports it.

**Minimum viable monitoring:**
```php
// composer require sentry/sentry-laravel
// config/sentry.php + .env: SENTRY_LARAVEL_DSN=...
```

**DO-16 (Medium): No uptime monitoring**
No `/health` endpoint monitoring (the endpoint exists but nothing checks it).

---

## Log Management

- Laravel logs to `storage/logs/laravel.log`
- Supervisor logs to `/var/log/supervisor/`
- **Issue:** No log aggregation (ELK, CloudWatch, Papertrail)
- **Issue:** `storage/logs/` volume not explicitly mounted in Docker Compose
- **Issue:** No log rotation policy for application logs (only supervisor logs noted)

---

## Disaster Recovery

| Scenario | Recovery Plan | Status |
|---|---|---|
| Container crash | Docker restart policy | ✅ (assumed `unless-stopped`) |
| Database corruption | Restore from backup | ❌ No backups |
| Redis data loss | Application continues (degrades) | ⚠️ Sessions lost |
| Code rollback | `git revert` + redeploy | ⚠️ No documented procedure |
| Full host failure | Move to new host | ❌ No documented procedure |

**Minimum DR documentation needed:**
1. Database backup restoration steps
2. Environment variable documentation (beyond .env.example)
3. Zero-downtime deployment procedure
4. Rollback steps
