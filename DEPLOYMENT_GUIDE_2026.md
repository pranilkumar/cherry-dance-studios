# 🚀 Cherry Dance Studios - Deployment Guide 2026

Complete guide to deploying the futuristic dance studio platform to production.

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] SSL certificate installed
- [ ] Database migrations completed
- [ ] Service worker tested offline
- [ ] PWA icons generated (all sizes)
- [ ] Stripe webhooks configured
- [ ] Firebase security rules updated
- [ ] Supabase RLS policies enabled
- [ ] Email templates configured
- [ ] CDN configured for static assets
- [ ] Domain configured
- [ ] Analytics tracking verified
- [ ] Backup system in place

---

## 🌐 Hosting Options

### Recommended: Vercel + Netlify + Supabase

#### 1. Vercel Deployment (Frontend)

**Advantages**:
- Auto-deploys on git push
- Global CDN
- Serverless functions
- Edge middleware
- Free tier generous
- Built for React/Vite

**Steps**:
1. Push code to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy!

```bash
npm run build  # Build locally first
```

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_key",
    "VITE_STRIPE_PUBLISHABLE_KEY": "@stripe_key"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### 2. Backend: Supabase + Firebase

**Supabase**:
- PostgreSQL database
- Real-time subscriptions
- Vector search for AI
- Authentication
- File storage

**Firebase**:
- Real-time messaging
- Push notifications
- Analytics

#### 3. DNS & SSL

Use Cloudflare for:
- DNS management
- SSL/TLS encryption
- DDoS protection
- Page caching
- Workers for redirects

---

## 🔐 Environment Setup for Production

### `.env.production`
```bash
# Core
VITE_NODE_ENV=production
VITE_API_URL=https://api.cherrydance.com
VITE_APP_URL=https://cherrydance.com

# Supabase Production
VITE_SUPABASE_URL=https://prod-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key-here

# Stripe Production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

# Firebase Production
VITE_FIREBASE_PROJECT_ID=cherry-dance-prod

# OpenAI Production
VITE_OPENAI_API_KEY=sk-prod-key...

# Push Notifications Production
VITE_PUBLIC_VAPID_KEY=prod-vapid-key...

# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXX
```

### Secrets Manager
Use Vercel Secrets for sensitive keys:
```bash
vercel env add STRIPE_SECRET_KEY
vercel env add OPENAI_API_KEY
vercel env add VAPID_PRIVATE_KEY
```

---

## 🗄️ Database Migration

### Supabase Schema Setup

1. **Create Tables**:
```sql
-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR,
  status VARCHAR DEFAULT 'active',
  enrollment_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Classes Table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name VARCHAR NOT NULL,
  instructor_id UUID REFERENCES instructors(id),
  schedule VARCHAR NOT NULL,
  capacity INT,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Fees Table
CREATE TABLE fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  amount DECIMAL(10, 2),
  due_date DATE,
  payment_status VARCHAR DEFAULT 'pending',
  payment_date TIMESTAMP,
  payment_method VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  class_id UUID REFERENCES classes(id),
  attended_at TIMESTAMP,
  status VARCHAR DEFAULT 'present',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions Table (for payments)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  amount DECIMAL(10, 2),
  currency VARCHAR DEFAULT 'USD',
  payment_method VARCHAR,
  stripe_transaction_id VARCHAR,
  status VARCHAR DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. **Enable Row Level Security (RLS)**:
```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own data" ON students
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admin can view all data" ON students
  FOR SELECT USING (auth.jwt()->>'role' = 'admin');
```

3. **Create Indexes**:
```sql
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_fees_student_id ON fees(student_id);
CREATE INDEX idx_fees_due_date ON fees(due_date);
CREATE INDEX idx_attendance_class_id ON attendance(class_id);
CREATE INDEX idx_transactions_student_id ON transactions(student_id);
```

---

## 💳 Stripe Webhook Configuration

### 1. Create Webhook Endpoint

```javascript
// Backend endpoint (Node.js/Express example)
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancelled(event.data.object);
      break;
  }

  res.json({ received: true });
});
```

### 2. Configure in Stripe Dashboard

1. Go to Settings > Webhooks
2. Add endpoint: `https://api.cherrydance.com/webhooks/stripe`
3. Select events to listen for
4. Copy signing secret to `.env.production`

---

## 📱 PWA & App Icons

### Generate Icons

Use online tool: https://realfavicongenerator.net/

Required sizes:
- 72x72 (Android)
- 96x96 (Android)
- 128x128 (Android)
- 144x144 (Android)
- 152x152 (iOS)
- 192x192 (Android)
- 384x384 (Android)
- 512x512 (Splash)

Place in `public/icons/`

### Update Manifest
```json
{
  "name": "Cherry Dance Studios",
  "short_name": "Cherry Dance",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#667eea",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

---

## 🔔 Push Notifications Setup

### 1. Firebase Cloud Messaging

```javascript
// In your backend
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendNotification(deviceToken, data) {
  const message = {
    notification: {
      title: data.title,
      body: data.body,
    },
    webpush: {
      notification: {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        click_action: data.clickAction || '/'
      }
    },
    tokens: [deviceToken]
  };

  return admin.messaging().sendMulticast(message);
}
```

### 2. Subscribe Users
```javascript
// Frontend
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: process.env.VITE_PUBLIC_VAPID_KEY
});

// Send to backend
await fetch('/api/subscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(subscription)
});
```

---

## 📊 Analytics Setup

### Google Analytics 4

```javascript
// src/main.jsx
import ReactGA from 'react-ga4';

ReactGA.initialize(import.meta.env.VITE_GOOGLE_ANALYTICS_ID);

// Track page views
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracking() {
  const location = useLocation();
  useEffect(() => {
    ReactGA.pageview(location.pathname);
  }, [location]);
}
```

### Supabase Analytics

Enable in Supabase > Settings > Analytics

---

## 🚀 Deployment Steps

### Step 1: Build Locally
```bash
npm run build
npm run preview  # Test build locally
```

### Step 2: Push to GitHub
```bash
git add .
git commit -m "Deploy: Futuristic 2026 features"
git push origin main
```

### Step 3: Deploy to Vercel
```bash
# Option 1: Automatic (connected to GitHub)
# Vercel auto-deploys on push

# Option 2: Manual
vercel deploy --prod
```

### Step 4: Test Production
- [ ] Check all features work
- [ ] Test offline mode
- [ ] Test push notifications
- [ ] Test payment flow
- [ ] Check analytics
- [ ] Monitor performance

### Step 5: Configure Custom Domain
```bash
vercel domains add cherrydance.com
# Follow DNS setup instructions
```

---

## 🔍 Monitoring & Maintenance

### Performance Monitoring
- Use Vercel Analytics
- Monitor Lighthouse scores
- Track Core Web Vitals
- Set up alerts for errors

### Error Tracking
```javascript
// Sentry Integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Logging
```javascript
// Winston for backend logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

---

## 🛡️ Security Checklist

- [ ] SSL/TLS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize HTML)
- [ ] CSRF tokens implemented
- [ ] Secure headers set (CSP, X-Frame-Options, etc.)
- [ ] API authentication required
- [ ] Database backups automated
- [ ] Logs monitored for suspicious activity

---

## 🚨 Troubleshooting

### Service Worker Not Loading
```bash
# Clear cache
rm -rf .next
npm run build
```

### Stripe Webhook Not Firing
1. Check endpoint URL is public
2. Verify signing secret matches
3. Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
```

### Push Notifications Not Working
1. Check VAPID keys are correct
2. Ensure HTTPS (required for notifications)
3. Verify service worker is registered
4. Check browser permissions

### High Latency
1. Enable Vercel Analytics
2. Check database query performance
3. Enable CDN caching
4. Optimize images

---

## 📈 Scaling Strategies

### As You Grow:

1. **Database**:
   - Enable read replicas
   - Implement caching (Redis)
   - Archive old data

2. **Backend**:
   - Use Vercel Functions
   - Implement job queues
   - Load balancing

3. **Frontend**:
   - Code splitting
   - Image optimization
   - Lazy loading

4. **Infrastructure**:
   - Multi-region deployment
   - CDN edge locations
   - Autoscaling

---

## 📞 Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **React Docs**: https://react.dev

---

**Last Updated**: January 2026
**Version**: 2.0.0 - Production Ready
