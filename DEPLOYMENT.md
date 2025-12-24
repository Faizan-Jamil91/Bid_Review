# Vercel Deployment Guide

## Prerequisites
- Vercel account
- GitHub repository with your code
- PostgreSQL database (recommended for production)

## Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Deploy from Root Directory
Navigate to the project root directory (where `vercel.json` is located):
```bash
cd bid-review-system
vercel
```

## Step 4: Environment Variables Setup

### Backend Environment Variables (in Vercel Dashboard):
```
DJANGO_SETTINGS_MODULE=bid_review_system.settings_production
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-django-secret-key
GEMINI_API_KEY=your-gemini-api-key
DEBUG=False
```

### Frontend Environment Variables (in Vercel Dashboard):
```
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_APP_NAME=Bid Review System
NODE_ENV=production
```

## Step 5: Database Setup

### Option 1: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to Storage > Create Database
2. Select Postgres
3. Copy the connection string to `DATABASE_URL`

### Option 2: External PostgreSQL
1. Set up PostgreSQL with any provider (Railway, Heroku, etc.)
2. Add the connection string to `DATABASE_URL`

## Step 6: Run Migrations
After first deployment, you'll need to run migrations:
```bash
vercel env pull .env.production
cd bid_review_system
python manage.py migrate
python manage.py createsuperuser
```

## Step 7: Static Files Collection
```bash
python manage.py collectstatic --noinput
```

## File Structure After Setup
```
bid-review-system/
├── vercel.json                 # Main Vercel configuration
├── requirements.txt            # Python dependencies
├── api/
│   └── index.py               # Django WSGI entry point
├── bid_review_system/
│   ├── settings_production.py # Production Django settings
│   └── wsgi.py               # Django WSGI
└── bid-review-frontend/        # Next.js frontend
    ├── package.json
    ├── next.config.ts
    └── vercel.json           # Frontend-specific config
```

## Deployment Commands

### Initial Deployment
```bash
vercel --prod
```

### Redeployment (after changes)
```bash
vercel --prod
```

### Local Development
```bash
# Backend
cd bid_review_system
python manage.py runserver

# Frontend
cd bid-review-frontend
npm run dev
```

## Important Notes

1. **Database**: Use PostgreSQL for production. SQLite won't work on Vercel
2. **Static Files**: Configured to use Whitenoise for serving static files
3. **Media Files**: For production, consider using AWS S3 or similar
4. **Environment Variables**: Set all sensitive data in Vercel dashboard, not in code
5. **CORS**: Update `CORS_ALLOWED_ORIGINS` in production settings with your Vercel domain

## Troubleshooting

### Common Issues:
1. **Module Not Found**: Check Python path in `api/index.py`
2. **Database Connection**: Verify `DATABASE_URL` is correct
3. **Static Files 404**: Run `collectstatic` command
4. **CORS Errors**: Update allowed origins in production settings

### Debug Mode:
To enable debug mode temporarily:
```bash
vercel env add DEBUG=production
# Set value to "True"
```

Remember to set it back to "False" after debugging!
