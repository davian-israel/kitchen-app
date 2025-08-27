# 🚀 Production Deployment Guide - Israel Kitchen

## Overview

This guide covers the complete production deployment of the Israel Kitchen food delivery application, including security hardening, performance optimization, monitoring, and CI/CD pipeline setup.

---

## 📋 Pre-Deployment Checklist

### Security Requirements ✅
- [x] Environment variables secured and not tracked in Git
- [x] Debug logging disabled in production
- [x] Security headers configured in Next.js
- [x] Authentication properly configured
- [x] Database connections secured
- [x] HTTPS enforcement ready
- [x] Dependency vulnerabilities addressed

### Performance Requirements ✅
- [x] Web Vitals monitoring implemented
- [x] Performance budgets defined
- [x] Image optimization configured
- [x] Bundle analysis ready
- [x] Caching strategies implemented

### Monitoring Requirements ✅
- [x] Health check endpoints implemented
- [x] Prometheus metrics configured
- [x] Application logging structured
- [x] Error tracking ready
- [x] Alerting rules defined

---

## 🔧 Environment Setup

### 1. Environment Variables

Create `.env.production` with the following variables:

```bash
# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication (NextAuth.js)
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secure-secret-key

# Payment Processing (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key

# Google Pay
NEXT_PUBLIC_GOOGLE_PAY_MERCHANT_ID=your_merchant_id

# Security
SKIP_ENV_VALIDATION=false
NEXTAUTH_DEBUG=false

# Optional: Monitoring
GRAFANA_PASSWORD=secure_grafana_password
```

### 2. SSL Certificates

Ensure you have valid SSL certificates:
```bash
# Let's Encrypt (recommended)
certbot certonly --webroot -w /var/www/html -d yourdomain.com

# Or use your certificate provider
# Place certificates in ./ssl/ directory
```

---

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd israel-kitchen

# 2. Set up environment variables
cp .env.example .env.production
# Edit .env.production with your values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml up -d

# 4. Run database migrations
docker-compose exec app npx prisma migrate deploy

# 5. Seed initial data (optional)
docker-compose exec app npm run db:seed
```

### Option 2: Manual Docker Build

```bash
# Build the image
docker build -t israel-kitchen:latest .

# Run with environment file
docker run -d \
  --name israel-kitchen \
  --env-file .env.production \
  -p 3000:3000 \
  israel-kitchen:latest
```

---

## ☁️ Cloud Deployment

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# or use CLI:
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... add all other variables
```

### AWS/Digital Ocean/GCP

1. **Set up your cloud infrastructure**
2. **Configure load balancer with SSL termination**
3. **Set up managed database (PostgreSQL)**
4. **Deploy using Docker or your preferred method**
5. **Configure monitoring and logging**

---

## 📊 Monitoring Setup

### 1. Start Monitoring Stack

```bash
# Start Prometheus, Grafana, and other monitoring tools
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Monitoring Dashboards

- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Application Metrics**: http://localhost:3000/api/metrics

### 3. Configure Alerts

Edit `monitoring/alertmanager.yml` for your notification preferences:
- Slack webhooks
- Email alerts
- PagerDuty integration

---

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

The repository includes a complete CI/CD pipeline (`.github/workflows/ci-cd.yml`):

1. **Automated Testing**: Runs tests on every push/PR
2. **Security Scanning**: Checks for vulnerabilities
3. **Docker Build**: Builds and pushes images
4. **Deployment**: Automatic deployment to staging/production

### Required GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# Container registry
GITHUB_TOKEN  # Automatically provided

# Deployment (if using custom deployment)
DEPLOY_HOST
DEPLOY_USER
DEPLOY_KEY

# Monitoring (optional)
SLACK_WEBHOOK_URL
```

---

## 🧪 Testing in Production

### Health Checks

```bash
# Application health
curl https://yourdomain.com/api/health

# Database connectivity
curl https://yourdomain.com/api/health | jq '.status'
```

### Performance Testing

```bash
# Install performance testing tools
npm install -g lighthouse artillery

# Run Lighthouse audit
lighthouse https://yourdomain.com --output=json

# Load testing
artillery quick --count 10 --num 10 https://yourdomain.com
```

### Security Testing

```bash
# SSL/TLS testing
ssllabs-scan -quiet -grade yourdomain.com

# Security headers
curl -I https://yourdomain.com
```

---

## 📈 Performance Optimization

### 1. CDN Setup
Configure a CDN (Cloudflare, AWS CloudFront) for:
- Static asset delivery
- Image optimization
- Geographic distribution

### 2. Database Optimization
- Enable connection pooling
- Add database indexes for frequent queries
- Set up read replicas if needed

### 3. Caching Strategy
- Redis for session storage
- Application-level caching
- Database query caching

---

## 🚨 Incident Response

### Monitoring Alerts

The system will alert you for:
- Application downtime
- High error rates
- Performance degradation
- Security issues
- Database connectivity problems

### Rollback Procedure

```bash
# Docker rollback
docker tag israel-kitchen:previous israel-kitchen:latest
docker-compose restart app

# Database rollback (if needed)
npx prisma migrate reset
```

### Debug Production Issues

```bash
# View application logs
docker-compose logs -f app

# Database queries
docker-compose exec db psql -U postgres -d israel_kitchen

# System metrics
docker stats
```

---

## 🔐 Security Hardening

### 1. Network Security
- Use firewalls to restrict access
- Enable VPN for admin access
- Set up fail2ban for SSH protection

### 2. Application Security
- Regular dependency updates
- Security scanning in CI/CD
- Rate limiting on API endpoints
- Input validation and sanitization

### 3. Database Security
- Strong passwords and limited privileges
- Regular backups with encryption
- Network isolation
- Audit logging enabled

---

## 📊 Performance Targets

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Application Performance
- **API Response Time**: < 200ms (95th percentile)
- **Page Load Time**: < 3s on 3G
- **Error Rate**: < 0.1%
- **Uptime**: 99.9%

### Resource Usage
- **Memory**: < 512MB per container
- **CPU**: < 1 core under normal load
- **Database**: Optimized queries < 100ms

---

## 🆘 Troubleshooting

### Common Issues

1. **Application Won't Start**
   ```bash
   # Check environment variables
   docker-compose exec app env | grep -E "(DATABASE|NEXTAUTH|STRIPE)"
   
   # Check database connection
   docker-compose exec app npx prisma db push
   ```

2. **Database Connection Issues**
   ```bash
   # Test connection
   docker-compose exec db pg_isready -U postgres
   
   # Check logs
   docker-compose logs db
   ```

3. **SSL/HTTPS Issues**
   ```bash
   # Verify certificates
   openssl x509 -in /path/to/cert.pem -text -noout
   
   # Test SSL configuration
   curl -I https://yourdomain.com
   ```

### Support Contacts

- **Application Issues**: development team
- **Infrastructure**: devops team  
- **Security**: security team
- **Database**: database administrators

---

## 📝 Maintenance

### Regular Tasks

- **Daily**: Monitor dashboards and alerts
- **Weekly**: Review performance metrics and logs
- **Monthly**: Security updates and dependency checks
- **Quarterly**: Performance optimization review

### Backup Strategy

```bash
# Database backups (automated)
# Configured in docker-compose.prod.yml
# Location: ./backups/

# Application backups
# Code: Git repository
# Environment: Secure environment variable storage
```

---

## ✅ Go-Live Checklist

- [ ] All environment variables configured
- [ ] SSL certificates installed and valid
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] Monitoring and alerting configured
- [ ] Performance targets met
- [ ] Security scan completed
- [ ] Backup systems tested
- [ ] Incident response plan ready
- [ ] Team training completed

---

**🎉 Congratulations! Your Israel Kitchen application is now production-ready!**

For ongoing support and updates, refer to the development team or repository documentation.