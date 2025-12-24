# Railway Backend Deployment - Manual Setup

Since CLI deployment is having issues, here's the manual setup process:

## Step 1: Create Railway Project
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Connect your GitHub repository
4. Select the `bid-review-system` repository

## Step 2: Configure Service
1. After connecting, click on your service
2. Go to "Settings" tab
3. Set the following:

### Build Settings:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn bid_review_system.wsgi:application --bind 0.0.0.0:$PORT`
- **Root Directory**: `bid_review_system`

### Environment Variables (Settings → Variables):
```
PORT=8000
DJANGO_SETTINGS_MODULE=bid_review_system.settings_production
SECRET_KEY=your-secret-key-here
DEBUG=False
DATABASE_URL=postgresql://user:password@host:port/database
GEMINI_API_KEY=your-gemini-key
```

## Step 3: Add PostgreSQL Database
1. In your Railway project, click "New Service"
2. Select "PostgreSQL"
3. Railway will provide `DATABASE_URL` - copy it to environment variables

## Step 4: Deploy
1. Click "Deploy" button
2. Railway will build and deploy your Django app
3. Wait for deployment to complete

## Step 5: Get Backend URL
After deployment, Railway will provide a URL like:
`https://your-app-name.up.railway.app`

## Step 6: Update Frontend
1. Go to Vercel dashboard: https://vercel.com/dashboard
2. Select your `bid-review-system` project
3. Go to Settings → Environment Variables
4. Add: `NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app`
5. Redeploy Vercel frontend

## Step 7: Configure CORS
In your Django settings, make sure to add:
```python
CORS_ALLOWED_ORIGINS = [
    "https://bid-review-system.vercel.app"
]
```

## Current Status:
✅ Frontend: https://bid-review-system.vercel.app
⏳ Backend: Needs manual Railway deployment

## Alternative: Use Railway Template
If manual setup doesn't work:
1. Go to https://railway.app/templates
2. Search "Django"
3. Use Django template and copy your code into it

## Test After Deployment:
1. Visit https://bid-review-system.vercel.app
2. Try to register/login
3. Check browser network tab for API calls to Railway backend
