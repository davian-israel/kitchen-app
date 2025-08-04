# 🔐 Security Guide - Environment Configuration

## 🚨 IMMEDIATE SECURITY ACTIONS REQUIRED

### **CRITICAL**: Your environment files were previously tracked by Git!

**What this means:**
- Your database credentials, API keys, and secrets may be exposed in Git history
- Anyone with access to your repository can see these sensitive values
- This is a serious security vulnerability

### **IMMEDIATE STEPS TO SECURE YOUR APPLICATION:**

## 1. 🔄 **Rotate All Secrets Immediately**

### **Database Security:**
```bash
# 1. Change your database password in Neon Dashboard
# 2. Update DATABASE_URL with new credentials
# 3. Test connection works
```

### **NextAuth Secret:**
```bash
# Generate a new secure secret
openssl rand -base64 32
# OR visit: https://generate-secret.vercel.app/32
# Update NEXTAUTH_SECRET in your .env files
```

### **Stripe Keys:**
```bash
# 1. Go to Stripe Dashboard
# 2. Regenerate your API keys
# 3. Update both publishable and secret keys
```

## 2. 📁 **Secure Environment File Setup**

### **Current Status:**
- ✅ `.gitignore` updated to exclude all .env files
- ✅ Existing .env files removed from Git tracking
- ✅ Secure `.env.example` template created
- ⚠️ **Action needed**: Update your actual .env files with secure values

### **Environment File Structure:**
```
.env.example          # Template (safe to commit)
.env                  # Local development (NEVER commit)
.env.local           # Local overrides (NEVER commit)
.env.production      # Production values (NEVER commit)
.env.staging         # Staging values (NEVER commit)
```

## 3. 🛡️ **Security Best Practices Implementation**

### **Strong Password Requirements:**
- **Database passwords**: 20+ characters, mixed case, numbers, symbols
- **NextAuth secrets**: 32+ characters, cryptographically random
- **API keys**: Use environment-specific keys (test vs production)

### **Environment Separation:**
```bash
# Development
DATABASE_URL="postgresql://dev_user:strong_dev_pass@localhost:5432/israel_kitchen_dev"
NEXTAUTH_URL="http://localhost:3000"

# Production  
DATABASE_URL="postgresql://prod_user:ultra_strong_prod_pass@prod-host:5432/israel_kitchen_prod"
NEXTAUTH_URL="https://israelkitchen.com"
```

### **Secret Management:**
- **Never hardcode secrets** in source code
- **Use different secrets** for each environment
- **Rotate secrets regularly** (quarterly minimum)
- **Use secret management services** for production (AWS Secrets Manager, Azure Key Vault)

## 4. 🔍 **Security Validation Checklist**

### **Environment File Security:**
- [ ] All .env files are in .gitignore
- [ ] No .env files are tracked by Git
- [ ] All secrets are environment-specific
- [ ] All secrets use strong, random values
- [ ] Production uses different secrets than development

### **Database Security:**
- [ ] Database password changed from exposed value
- [ ] Database uses SSL/TLS encryption
- [ ] Database access restricted to necessary IPs
- [ ] Database backups are encrypted

### **API Key Security:**
- [ ] Stripe keys regenerated
- [ ] Test vs production keys properly separated
- [ ] Webhook secrets configured
- [ ] API key access logs monitored

### **Application Security:**
- [ ] NEXTAUTH_SECRET changed to new random value
- [ ] CSRF protection enabled (remove NEXTAUTH_SKIP_CSRF_CHECK)
- [ ] HTTPS enabled in production
- [ ] Security headers configured

## 5. 🚀 **Secure Deployment Practices**

### **Environment Variable Management:**
```bash
# ✅ Good: Environment variables from secure store
DATABASE_URL=$DATABASE_URL_FROM_SECRETS_MANAGER

# ❌ Bad: Hardcoded in deployment scripts
DATABASE_URL="postgresql://user:pass@host/db"
```

### **CI/CD Security:**
- Use encrypted environment variables
- Never log sensitive values
- Use secure secret injection
- Audit deployment logs for accidental exposure

### **Production Checklist:**
- [ ] Use production database with strong credentials
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure security headers (HSTS, CSP, etc.)
- [ ] Set up monitoring and alerting
- [ ] Regular security scans
- [ ] Backup and disaster recovery plan

## 6. 🔧 **How to Fix Your Current Setup**

### **Step 1: Secure Your Current Environment**
```bash
# 1. Generate new NextAuth secret
openssl rand -base64 32

# 2. Copy to your .env file
echo "NEXTAUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env

# 3. Remove insecure flags
# Remove or comment out: NEXTAUTH_SKIP_CSRF_CHECK=skip
```

### **Step 2: Update Database Credentials**
```bash
# 1. Go to your Neon Dashboard
# 2. Reset database password
# 3. Update DATABASE_URL in .env files
# 4. Test connection
npm run dev
```

### **Step 3: Regenerate API Keys**
```bash
# 1. Stripe Dashboard > API Keys > Regenerate
# 2. Update STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# 3. Test payment functionality
```

### **Step 4: Verify Security**
```bash
# Check no env files are tracked
git status
git ls-files | grep -E "\.env"

# Should return empty - if not, run:
git rm --cached .env*
```

## 7. 📚 **Security Resources**

### **Secret Generation Tools:**
- OpenSSL: `openssl rand -base64 32`
- Online: https://generate-secret.vercel.app/32
- Node.js: `require('crypto').randomBytes(32).toString('base64')`

### **Security Scanning:**
- GitHub Secret Scanning (if using GitHub)
- GitGuardian for Git history scanning
- Snyk for dependency vulnerabilities
- OWASP ZAP for application security testing

### **Documentation:**
- [NextAuth.js Security](https://next-auth.js.org/configuration/options#secret)
- [Stripe Security Best Practices](https://stripe.com/docs/security)
- [OWASP Environment Variables Guide](https://owasp.org/www-community/vulnerabilities/Sensitive_Data_Exposure)

## 8. 🚨 **Incident Response Plan**

### **If Secrets Are Compromised:**
1. **Immediately rotate all affected secrets**
2. **Monitor for unauthorized access**
3. **Audit application logs for suspicious activity**
4. **Notify relevant stakeholders**
5. **Document the incident for future prevention**

### **Regular Security Maintenance:**
- **Monthly**: Review access logs
- **Quarterly**: Rotate secrets
- **Annually**: Security audit and penetration testing

---

## ✅ **Security Status After Implementation:**

- [ ] All secrets rotated and secured
- [ ] Environment files properly configured
- [ ] Git history cleaned (if needed)
- [ ] Production deployment secured
- [ ] Monitoring and alerting set up
- [ ] Team trained on security practices

**Remember: Security is an ongoing process, not a one-time setup!**