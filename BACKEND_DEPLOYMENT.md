# Backend Deployment Options

Since the Django backend is too large for Vercel's serverless functions (250MB limit), here are the recommended deployment options:

## Option 1: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy from project root
cd bid_review_system
railway deploy
```

**Environment Variables for Railway:**
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Django secret key
- `DEBUG`: False
- `GEMINI_API_KEY`: Your Gemini API key

## Option 2: Heroku
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Set buildpack
heroku buildpacks:set heroku/python

# Push to Heroku
git subtree push --prefix bid_review_system heroku main
```

## Option 3: DigitalOcean App Platform
1. Create a new App in DigitalOcean dashboard
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set run command: `gunicorn bid_review_system.wsgi:application`
5. Add environment variables

## Option 4: PythonAnywhere
1. Create a Web account
2. Upload your code
3. Set up virtual environment
4. Install requirements
5. Configure WSGI

## Option 5: AWS EC2 + Docker
```dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "bid_review_system.wsgi:application", "--bind", "0.0.0.0:8000"]
```

## Next Steps After Backend Deployment:

1. **Update frontend environment variables in Vercel:**
   - Go to Vercel dashboard → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`

2. **Configure CORS in backend:**
   - Add your Vercel domain to CORS_ALLOWED_ORIGINS
   - Example: `https://bid-review-system.vercel.app`

3. **Test the integration:**
   - Visit https://bid-review-system.vercel.app
   - Try login/register functionality
   - Check browser console for API calls

## Current Status:
✅ **Frontend**: Deployed at https://bid-review-system.vercel.app
⏳ **Backend**: Needs deployment on separate service

## Recommended Choice:
**Railway** is recommended because:
- Easy Django deployment
- Built-in PostgreSQL
- Good free tier
- Simple environment variable management
- Automatic HTTPS
