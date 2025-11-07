# CrypTalk Docker Setup Guide

## Quick Start

### 1. Development Environment
```bash
docker-compose --profile dev up -d
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

### 2. Full Stack (Dev + Database)
```bash
docker-compose --profile full up -d
```

### 3. Production Environment
```bash
docker-compose --profile prod up -d
```

Includes reverse proxy via Nginx

### 4. With Monitoring
```bash
docker-compose --profile dev --profile monitoring up -d
```

Prometheus: http://localhost:9090  
Grafana: http://localhost:3001

---

## Build Images Locally

### Build All
```bash
docker-compose build
```

### Build Specific Service
```bash
docker-compose build backend
docker-compose build frontend
```

---

## Environment Variables

Create `.env` file:
```env
NODE_ENV=production
MONGO_ROOT_USER=admin
MONGO_ROOT_PASSWORD=secure_password_here
JWT_SECRET=your-secret-key-change-me
FRONTEND_URL=http://localhost:3000
VITE_API_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000
BACKEND_PORT=5000
FRONTEND_PORT=3000
MONGO_PORT=27017
GRAFANA_PASSWORD=admin
```

---

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Stop & Remove Volumes
```bash
docker-compose down -v
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Enter Container Shell
```bash
docker-compose exec backend sh
docker-compose exec frontend sh
docker-compose exec mongodb mongosh
```

### Scale Services
```bash
docker-compose up -d --scale backend=3
```

---

## Database Management

### MongoDB Shell
```bash
docker-compose exec mongodb mongosh -u admin -p password
```

### Backup Database
```bash
docker-compose exec mongodb mongodump --archive=/backup/cryptalk.archive -u admin -p password
```

### Restore Database
```bash
docker-compose exec mongodb mongorestore --archive=/backup/cryptalk.archive -u admin -p password
```

---

## Health Checks

### Check Service Health
```bash
docker-compose ps

# Should see:
# NAME                    STATUS
# cryptalk-backend       Up (healthy)
# cryptalk-frontend      Up (healthy)
# cryptalk-mongodb       Up (healthy)
```

### Manual Health Check
```bash
curl http://localhost:5000/api/health
curl http://localhost:3000/health
```

---

## Security Considerations

1. **Change Default Passwords**
   - MongoDB: Change `MONGO_ROOT_PASSWORD`
   - JWT Secret: Change `JWT_SECRET`
   - Grafana: Change `GRAFANA_PASSWORD`

2. **Use Production Environment**
   ```env
   NODE_ENV=production
   ```

3. **Enable HTTPS**
   - Add SSL certificates to `./ssl/certs/`
   - Configure Nginx with SSL

4. **Network Isolation**
   - Use separate networks for different environments
   - Restrict MongoDB access

5. **Secrets Management**
   - Use Docker Secrets for sensitive data in Swarm
   - Use environment variables from secure sources

---

## Performance Tuning

### MongoDB
- Increase `memory`: `10240` MB in production
- Enable `--wiredTigerCacheSizeGB=4`

### Backend
- Set `NODE_ENV=production`
- Use multiple replicas: `--scale backend=3`

### Frontend
- Enable gzip compression in Nginx
- Set cache headers for static files

---

## Monitoring & Logs

### Prometheus Metrics
```
http://localhost:9090
```

### Grafana Dashboards
```
http://localhost:3001
admin / admin (change password!)
```

### Log Aggregation
```bash
# View all logs
docker-compose logs -f --tail=100
```

---

## Troubleshooting

### MongoDB Connection Failed
```bash
# Ensure MongoDB is healthy
docker-compose ps mongodb
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Backend Container Crashing
```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose exec backend env
```

### Frontend Not Loading
```bash
# Check Nginx logs
docker-compose exec frontend nginx -t
docker-compose logs frontend

# Verify build output
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### Network Issues
```bash
# Inspect network
docker network inspect cryptalk_cryptalk-network

# Restart network
docker-compose down
docker-compose up -d
```

---

## Production Deployment

### Railway
```bash
# Install Railway CLI
npm install -g railway

# Login
railway login

# Deploy
railway init
railway add
railway up
```

### Render
```bash
# Connect GitHub repository
# Set environment variables in dashboard
# Deploy from GitHub

# Environment variables:
MONGODB_URI=...
JWT_SECRET=...
NODE_ENV=production
```

### Docker Hub
```bash
# Build and tag
docker build -t yourusername/cryptalk-backend:latest ./backend
docker build -t yourusername/cryptalk-frontend:latest ./frontend

# Push
docker push yourusername/cryptalk-backend:latest
docker push yourusername/cryptalk-frontend:latest
```

---

## Resources

- Docker Documentation: https://docs.docker.com
- Docker Compose: https://docs.docker.com/compose/
- MongoDB Docker: https://hub.docker.com/_/mongo
- Nginx Docker: https://hub.docker.com/_/nginx
- Best Practices: https://docs.docker.com/develop/develop-images/dockerfile_best-practices/
