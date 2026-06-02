---
name: devops
description: Design CI/CD pipelines, deployment strategies, infrastructure decisions, Docker/Kubernetes setup, monitoring, and release processes. Use when the user mentions "CI/CD", "pipeline", "deploy", "deployment", "Docker", "Kubernetes", "infrastructure", "GitHub Actions", "monitoring", "rollback", "staging", "production deploy", or "DevOps".
metadata:
  version: 1.0.0
---

# DevOps Skill

Ship faster with confidence. CI/CD, infra decisions, deployment strategies, and monitoring for early-stage to scaling products.

---

## Before Starting

1. **Stack** — What language/framework? (Node, Python, React, etc.)
2. **Hosting** — Where is it deployed? (Vercel, Railway, AWS, Render, Fly.io, VPS)
3. **Stage** — Early-stage (simplicity) or scaling (reliability)?
4. **Current pain** — Slow deploys, broken pipelines, no monitoring, manual process?

---

## CI/CD Pipeline Design

### Minimal viable pipeline (early-stage)

```yaml
# GitHub Actions — .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install
        run: npm install  # or pip install, etc.

      - name: Test
        run: npm test

      - name: Deploy
        run: # your deploy command (Railway CLI, Vercel CLI, etc.)
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
```

### Production-grade pipeline stages

```
1. Trigger (push to branch / PR / tag)
2. Lint & format check
3. Unit tests
4. Integration tests
5. Build & containerize
6. Security scan (dependencies + image)
7. Push to registry
8. Deploy to staging
9. Smoke tests on staging
10. Manual gate (or auto) → deploy to production
11. Post-deploy health check
12. Notify (Slack, email)
```

---

## Deployment Strategies

| Strategy | Risk | Downtime | Best For |
|----------|------|----------|---------|
| **Direct deploy** | High | Possible | Dev/staging only |
| **Rolling update** | Medium | None | Most cases |
| **Blue/Green** | Low | None | Critical services |
| **Canary** | Very Low | None | High-traffic, risk-averse |
| **Feature flags** | Very Low | None | Gradual rollout without redeployment |

### Blue/Green (recommended for RanchPad/MIA production)
- Maintain two identical environments (blue = current, green = new)
- Deploy to green → run tests → flip traffic
- Rollback = flip traffic back to blue (seconds, not minutes)

### Canary
- Route 5% of traffic to new version
- Monitor error rates and latency
- Gradually increase to 100% if healthy
- Roll back if metrics degrade

---

## Docker Essentials

### Dockerfile best practices

```dockerfile
# Use specific version tags, not latest
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build if needed
RUN npm run build

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### .dockerignore (always include)
```
node_modules
.env
.env.*
*.log
.git
dist
coverage
```

---

## Environment & Secrets Management

**Never commit secrets to git. Never.**

| Tool | Best For |
|------|---------|
| GitHub Actions Secrets | CI/CD variables |
| Vercel / Railway env vars | Platform-managed |
| AWS Parameter Store | AWS-hosted apps |
| Doppler | Cross-platform secret sync |
| `.env` files | Local dev only, gitignored |

**Secret rotation checklist:**
- [ ] API keys rotated quarterly
- [ ] Old keys revoked after rotation
- [ ] No secrets in logs or error messages
- [ ] Secrets scoped to minimum permissions

---

## Monitoring & Observability

### The three pillars

**Logs** — What happened
- Structured JSON logging (not plain text)
- Log levels: ERROR > WARN > INFO > DEBUG
- Ship to: Datadog, Logtail, Papertrail, or CloudWatch

**Metrics** — How it's performing
- Uptime / availability
- Response time (p50, p95, p99)
- Error rate
- CPU/memory usage
- Custom business metrics (new signups, API calls)

**Alerts** — When to wake someone up
- Error rate > 1% → alert
- Response time p95 > 2s → alert
- Uptime < 99.9% → alert
- Disk/memory > 80% → warn

### Minimal monitoring stack for early-stage

```
Uptime monitoring: UptimeRobot (free) or Better Uptime
Error tracking: Sentry (free tier)
Logs: Logtail or Railway built-in logs
Metrics: Railway/Vercel built-in dashboard
```

---

## Health Check Endpoint

Every production service should have one:

```javascript
// Express example
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});
```

Use this in:
- Docker HEALTHCHECK
- Load balancer health checks
- CI/CD post-deploy smoke tests
- Uptime monitors

---

## Rollback Procedures

**Prepare before you need it:**

1. **Tag every production release** — `git tag v1.2.3`
2. **Keep previous Docker images** — don't prune immediately
3. **Document the rollback command** — run it in a drill quarterly
4. **Database migrations** — always backward-compatible, never destructive

**Rollback decision tree:**
```
Error rate > 5%? → Rollback immediately
Response time 3x normal? → Rollback
Critical feature broken? → Rollback
Minor bug, workaround exists? → Hotfix forward
```

---

## Platform Recommendations by Stage

| Stage | Hosting | CI/CD | Cost |
|-------|---------|-------|------|
| MVP / side project | Railway, Render, Fly.io | GitHub Actions | $5-20/mo |
| Early revenue | Railway Pro, Render | GitHub Actions | $25-100/mo |
| Growing ($10K+ MRR) | AWS ECS / Fargate | GitHub Actions + AWS CodePipeline | $100-500/mo |
| Scale | AWS/GCP/Azure + Kubernetes | Full GitOps (ArgoCD) | Custom |

**For RanchPad/MIA current stage:** Railway or Render with GitHub Actions is the right call. Don't over-engineer early.

---

## Related Skills

- **error-handling-patterns** — What to do when things break in production
- **api-docs** — Document the APIs you're deploying
- **saas-metrics** — Monitor business metrics alongside infra metrics
