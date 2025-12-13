# Production Deployment Guide

Complete guide for deploying Job Application Tracker to production.

## Pre-Deployment Checklist

### Infrastructure

- [ ] Dedicated server or cloud VM (AWS EC2, DigitalOcean, etc.)
- [ ] Minimum specs: 2 vCPU, 4GB RAM, 50GB storage
- [ ] Recommended: 4 vCPU, 8GB RAM, 100GB SSD
- [ ] Ubuntu 22.04 LTS or similar

### Domain & SSL

- [ ] Domain name registered
- [ ] SSL certificate obtained (Let's Encrypt free)
- [ ] DNS configured pointing to server

### Security

- [ ] SSH key pair generated
- [ ] Firewall rules configured
- [ ] Environment variables secured
- [ ] Database backups planned
- [ ] Monitoring setup

## Installation & Setup

### 1. Initial Server Setup

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install required tools
sudo apt-get install -y \
    curl \
    wget \
    git \
    htop \
    net-tools \
    vim

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Configure Application

```bash
# Clone repository
git clone https://github.com/yourusername/job-application-tracker.git
cd job_application_tracker

# Create production environment file
cp .env.example .env.production

# Edit production configuration
nano .env.production
```

### 3. Production Environment Configuration

```bash
# .env.production

# Database - Use strong password
POSTGRES_USER=jobtracker_prod
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=job_tracker_prod
DB_HOST=postgres
DB_PORT=5432

# Redis - Use strong password
REDIS_PASSWORD=$(openssl rand -base64 32)
REDIS_PORT=6379

# Application URLs
BACKEND_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com

# Security
DEBUG=False
LOG_LEVEL=INFO
SECRET_KEY=$(openssl rand -base64 32)

# ML Model
MODEL_PATH=/app/model.pkl
RETRAIN_INTERVAL_DAYS=7

# Cache
CACHE_TTL_ANALYTICS=300
CACHE_TTL_LIST=120
CACHE_TTL_DETAIL=600
```

### 4. SSL Certificate Setup

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Request certificate for domain
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d api.yourdomain.com

# Certificates saved to /etc/letsencrypt/live/yourdomain.com/
```

### 5. Nginx Reverse Proxy Configuration

```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/job-tracker > /dev/null <<EOF
upstream backend {
    server localhost:8000;
}

upstream frontend {
    server localhost:5173;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/job-tracker /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6. Docker Compose Modifications for Production

```bash
# Create production docker-compose file
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: job-tracker-postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - job-tracker-network

  redis:
    image: redis:7-alpine
    container_name: job-tracker-redis
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_prod_data:/data
    networks:
      - job-tracker-network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: job-tracker-backend
    restart: always
    environment:
      DB_USER: ${POSTGRES_USER}
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: ${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      DEBUG: ${DEBUG:-False}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    expose:
      - "8000"
    depends_on:
      - postgres
      - redis
    networks:
      - job-tracker-network

  frontend:
    build:
      context: ./job_tracker_frontend
      dockerfile: Dockerfile
    container_name: job-tracker-frontend
    restart: always
    environment:
      VITE_API_URL: ${VITE_API_URL}
    expose:
      - "5173"
    depends_on:
      - backend
    networks:
      - job-tracker-network

volumes:
  postgres_prod_data:
    driver: local
  redis_prod_data:
    driver: local

networks:
  job-tracker-network:
    driver: bridge
```

### 7. Deploy Application

```bash
# Load environment
export $(cat .env.production | xargs)

# Build and start services
docker-compose -f docker-compose.prod.yml up -d --build

# Verify services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f backend
```

### 8. Database Setup

```bash
# Initialize database
docker-compose -f docker-compose.prod.yml exec backend \
    python -c "from database import init_db; init_db()"

# Train ML model
docker-compose -f docker-compose.prod.yml exec backend \
    python train_model.py
```

## Backup Strategy

### PostgreSQL Backups

```bash
#!/bin/bash
# backup-postgres.sh

BACKUP_DIR="/home/user/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/job_tracker_$TIMESTAMP.sql"

# Create backup
docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U $POSTGRES_USER $POSTGRES_DB > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

### Backup Schedule (Cron)

```bash
# Daily backups at 2 AM
0 2 * * * /home/user/backup-postgres.sh

# Weekly full backup at Sunday midnight
0 0 * * 0 /home/user/backup-postgres.sh
```

### Redis Persistence

Redis is configured with AOF (Append-Only File) persistence:

```bash
# Verify redis persistence
docker-compose -f docker-compose.prod.yml exec redis \
    redis-cli --rdb /data/dump.rdb
```

## Monitoring & Logging

### Application Monitoring

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Get specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Save logs to file
docker-compose -f docker-compose.prod.yml logs > app_logs.txt
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt-get install -y htop iotop nethogs

# Monitor system resources
htop

# Check disk usage
df -h

# Check Docker resource usage
docker stats
```

### Uptime Monitoring

Set up external monitoring (example with Uptime Robot):

1. Create UptimeRobot account
2. Add monitoring URL: <https://api.yourdomain.com/health>
3. Set check interval: 5 minutes
4. Configure alerts to email

## Performance Optimization

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_applications_company ON job_applications(company);
CREATE INDEX idx_applications_stage ON job_applications(current_stage);
CREATE INDEX idx_applications_status ON job_applications(status);
CREATE INDEX idx_applications_date ON job_applications(application_date DESC);
```

### Redis Configuration

```bash
# Production Redis settings
maxmemory 2gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
```

### Backend Performance

```python
# In main.py, enable production settings
if not DEBUG:
    # Use uvicorn workers
    # gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
    pass
```

## Scaling

### Horizontal Scaling (Multiple Instances)

```yaml
# docker-compose with load balancing
# Use nginx to distribute load across multiple backend instances
services:
  backend-1:
    # Instance 1
  backend-2:
    # Instance 2
  backend-3:
    # Instance 3
```

### Database Connection Pooling

PostgreSQL connection pooling with PgBouncer:

```bash
# Install pgbouncer
sudo apt-get install -y pgbouncer

# Configure connection pooling
# /etc/pgbouncer/pgbouncer.ini
[databases]
job_tracker_db = host=postgres port=5432 dbname=job_tracker_prod

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
```

## Security Hardening

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Secrets Management

```bash
# Use environment file permissions
chmod 600 .env.production

# Never commit secrets
echo ".env.production" >> .gitignore
```

### Security Headers

Already configured in nginx (see Nginx section above):

- HSTS (HTTP Strict-Transport-Security)
- X-Frame-Options (SAMEORIGIN)
- X-Content-Type-Options (nosniff)
- X-XSS-Protection

### Rate Limiting

```bash
# Add rate limiting to nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs backend

# Verify environment variables
docker-compose -f docker-compose.prod.yml config

# Check network
docker network ls
docker network inspect job_tracker_network
```

### Database connection errors

```bash
# Test connection
docker-compose -f docker-compose.prod.yml exec backend \
    psql -h postgres -U $POSTGRES_USER -d $POSTGRES_DB

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

### High memory usage

```bash
# Check which service is using memory
docker stats

# Increase Docker memory limit
# Edit /etc/docker/daemon.json
{
  "memory": "8g"
}

# Restart docker
sudo systemctl restart docker
```

### SSL certificate issues

```bash
# Check certificate expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Auto-renew setup
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Maintenance

### Regular Updates

```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade -y

# Update Docker images
docker pull postgres:16-alpine
docker pull redis:7-alpine

# Rebuild application images
docker-compose -f docker-compose.prod.yml build --pull
```

### Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
docker system prune -a
```

## Disaster Recovery

### Restore from Backup

```bash
# Extract backup
gunzip job_tracker_20251206_020000.sql.gz

# Restore database
docker-compose -f docker-compose.prod.yml exec -T postgres \
    psql -U $POSTGRES_USER $POSTGRES_DB < job_tracker_20251206_020000.sql

# Verify restoration
docker-compose -f docker-compose.prod.yml exec backend \
    python -c "from database import SessionLocal; print('DB OK')"
```

### Migration to New Server

```bash
# 1. Backup current data
./backup-postgres.sh

# 2. Transfer backup to new server
scp job_tracker_*.sql.gz user@newserver:/tmp/

# 3. Set up new server (follow Installation steps)

# 4. Restore backup
# (Follow Restore from Backup steps)
```

## Production Checklist

- [ ] SSL certificate installed
- [ ] Nginx reverse proxy configured
- [ ] Database backups scheduled
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Firewall rules applied
- [ ] Environment variables secured
- [ ] ML model trained
- [ ] Performance optimized
- [ ] Disaster recovery plan documented
- [ ] Team trained on operations
- [ ] Runbook created

---

**Last Updated**: December 2025
