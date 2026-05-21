# Deployment Guide

## Architecture Overview

Your app has two components that need to be deployed:

1. **Next.js App** - The main web application
2. **Render Worker** - Blender-based 3D model generation service

## Deployment Options

### Option 1: Vercel + Railway (Recommended)

**Main App on Vercel:**
- Free tier available
- Automatic deployments from Git
- Built-in Next.js optimization

**Render Worker on Railway:**
- Docker support
- Persistent storage
- Easy environment variables

### Option 2: Single VPS (DigitalOcean/AWS/Hetzner)

Deploy both services on one server using Docker Compose.

---

## Option 1: Vercel + Railway

### Step 1: Deploy Main App to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your GitHub repo
   - Configure environment variables:
     ```
     DATABASE_URL=file:./dev.db
     NVIDIA_API_KEY=your_key
     GROQ_API_KEY=your_key
     GOOGLE_API_KEY=your_key
     RENDER_WORKER_URL=https://your-render-worker.railway.app
     ```
   - Deploy!

3. **Setup Database:**
   - For production, use PostgreSQL instead of SQLite
   - Update `DATABASE_URL` to PostgreSQL connection string
   - Run migrations:
     ```bash
     npx prisma migrate deploy
     ```

### Step 2: Deploy Render Worker to Railway

1. **Create Railway Account:**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repo
   - Set root directory to `render-worker`

3. **Configure:**
   - Add environment variable:
     ```
     PORT=8787
     ```
   - Railway will automatically detect the Dockerfile
   - Deploy!

4. **Get Public URL:**
   - Railway will give you a public URL like `https://your-app.railway.app`
   - Copy this URL

5. **Update Vercel Environment:**
   - Go back to Vercel dashboard
   - Add environment variable:
     ```
     RENDER_WORKER_URL=https://your-render-worker.railway.app
     ```
   - Redeploy

---

## Option 2: Single VPS Deployment

### Prerequisites
- VPS with Docker installed (Ubuntu 22.04 recommended)
- Domain name (optional but recommended)
- At least 2GB RAM, 2 CPU cores

### Step 1: Setup VPS

```bash
# SSH into your VPS
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y
```

### Step 2: Create Docker Compose File

Create `docker-compose.yml` in your project root:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/fulcrum
      - NVIDIA_API_KEY=${NVIDIA_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - RENDER_WORKER_URL=http://render-worker:8787
    depends_on:
      - db
      - render-worker
    restart: unless-stopped

  render-worker:
    build: ./render-worker
    ports:
      - "8787:8787"
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=fulcrum
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Create Main App Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build app
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Step 4: Update next.config.mjs

Add standalone output:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

### Step 5: Deploy

```bash
# Clone your repo on the VPS
git clone YOUR_REPO_URL
cd fulcrum

# Create .env file
nano .env
# Add your API keys

# Build and start
docker-compose up -d

# Run migrations
docker-compose exec app npx prisma migrate deploy
```

### Step 6: Setup Nginx (Optional)

For custom domain and SSL:

```bash
# Install Nginx
apt install nginx certbot python3-certbot-nginx -y

# Create Nginx config
nano /etc/nginx/sites-available/fulcrum
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/fulcrum /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Get SSL certificate
certbot --nginx -d your-domain.com
```

---

## Environment Variables

Make sure to set these in production:

```env
# Database (use PostgreSQL in production)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# AI APIs
NVIDIA_API_KEY=nvapi-xxx
GROQ_API_KEY=gsk_xxx
GOOGLE_API_KEY=xxx

# Render Worker
RENDER_WORKER_URL=http://render-worker:8787
```

---

## Post-Deployment Checklist

- [ ] Database migrations run successfully
- [ ] Environment variables configured
- [ ] Render worker accessible from main app
- [ ] SSL certificate installed (if using custom domain)
- [ ] Test 3D model generation
- [ ] Monitor logs for errors
- [ ] Setup backups for database

---

## Monitoring

### Check Logs

**Vercel:**
- View logs in Vercel dashboard

**Railway:**
- View logs in Railway dashboard

**Docker:**
```bash
docker-compose logs -f app
docker-compose logs -f render-worker
```

### Health Checks

Test render worker:
```bash
curl http://your-render-worker-url/render -X POST \
  -H "Content-Type: application/json" \
  -d '{"generator":"blender","script":"import bpy"}'
```

---

## Scaling Considerations

1. **Database**: Use managed PostgreSQL (Supabase, Neon, Railway)
2. **Render Worker**: Can be scaled horizontally with load balancer
3. **File Storage**: Use S3 for generated models instead of local storage
4. **Caching**: Add Redis for session/cache management

---

## Cost Estimates

**Vercel + Railway:**
- Vercel: Free (hobby) or $20/mo (pro)
- Railway: ~$5-20/mo depending on usage
- Total: $5-40/mo

**Single VPS:**
- DigitalOcean Droplet: $12-24/mo
- Hetzner VPS: €4-8/mo
- Total: $5-25/mo

---

## Troubleshooting

**Render worker connection fails:**
- Check RENDER_WORKER_URL is correct
- Verify render worker is running
- Check firewall rules

**Database connection fails:**
- Verify DATABASE_URL format
- Check database is running
- Run migrations

**Build fails:**
- Check Node.js version (20+)
- Clear .next folder and rebuild
- Verify all dependencies installed

---

## Support

For issues, check:
1. Application logs
2. Render worker logs
3. Database connection
4. API key validity
