# Bid Review System - Complete Documentation

## Overview
A comprehensive bid management system with AI-powered analysis, document management, and workflow automation. This system helps organizations streamline their bid processes, improve win rates, and manage customer relationships effectively.

## Architecture

### Backend (Django + Django REST Framework)
- **Framework**: Django 4.x with Django REST Framework
- **Database**: PostgreSQL with optimized indexes
- **AI/ML**: Google Gemini AI integration, Custom ML models
- **Authentication**: JWT-based with role-based permissions
- **File Storage**: Django FileField with media management
- **Caching**: Redis (production) / In-memory (development)

### Frontend (Next.js + TypeScript)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript for type safety
- **UI**: Tailwind CSS with Heroicons
- **State Management**: React hooks and context
- **HTTP Client**: Axios with interceptors
- **Notifications**: React Hot Toast

## Backend Features

### Core Models

#### Bid Model
```python
class Bid(models.Model):
    # Core Information
    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=500)
    description = models.TextField()
    
    # Classification
    priority = models.CharField(choices=Priority.choices)
    complexity = models.CharField(choices=Complexity.choices)
    business_unit = models.CharField(choices=[('JIS', 'JIS'), ('JCS', 'JCS')])
    
    # Financial Information
    bid_value = models.DecimalField(max_digits=20, decimal_places=2)
    estimated_cost = models.DecimalField(max_digits=20, decimal_places=2)
    profit_margin = models.DecimalField(max_digits=5, decimal_places=2)
    
    # AI/ML Features
    win_probability = models.DecimalField()  # ML predicted
    risk_score = models.DecimalField()      # ML calculated
    ai_recommendations = models.JSONField()
    ml_features = models.JSONField()
    
    # Status & Workflow
    status = models.CharField(choices=BidStatus.choices)
    progress = models.IntegerField(validators=[MinValueValidator(0), MaxValueValidator(100)])
```

#### Customer Model
```python
class Customer(models.Model):
    name = models.CharField(max_length=200, unique=True)
    customer_type = models.CharField(choices=[
        ('government', 'Government'),
        ('corporate', 'Corporate'),
        ('sme', 'SME'),
        ('individual', 'Individual')
    ])
    relationship_score = models.IntegerField(default=50)
    annual_revenue = models.DecimalField()
    tags = ArrayField(models.CharField(max_length=50))
```

#### BidDocument Model
```python
class BidDocument(models.Model):
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, related_name='documents')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to='bid_documents/')
    file_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL)
    description = models.TextField(blank=True)
```

#### BidReview Model
```python
class BidReview(models.Model):
    bid = models.ForeignKey(Bid, on_delete=models.CASCADE, related_name='reviews')
    review_type = models.CharField(choices=ReviewType.choices)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL)
    status = models.CharField(choices=[('pending', 'Pending'), ('in_progress', 'In Progress')])
    decision = models.CharField(choices=Decision.choices)
    ai_analysis = models.JSONField()
    sentiment_score = models.DecimalField()
```

### AI & ML Features

#### Gemini AI Client
- **Requirements Analysis**: Structured extraction from bid requirements
- **Proposal Generation**: AI-powered proposal content creation
- **Review Analysis**: Sentiment analysis and feedback insights

#### ML Prediction System
- **Win Probability**: Historical data-based prediction
- **Risk Scoring**: Multi-factor risk assessment
- **Complexity Analysis**: Automated complexity evaluation

### API Endpoints

#### Bid Management
```
GET    /api/bids/                    # List all bids
POST   /api/bids/                    # Create new bid
GET    /api/bids/{id}/               # Get bid details
PUT    /api/bids/{id}/               # Update bid
DELETE /api/bids/{id}/               # Delete bid
GET    /api/bids/dashboard/          # Dashboard data
```

#### Document Management
```
GET    /api/bids/{id}/documents/           # List bid documents
POST   /api/bids/{id}/upload_documents/    # Upload documents
PATCH  /api/bids/{id}/documents/{doc_id}/   # Update document
DELETE /api/bids/{id}/documents/{doc_id}/   # Delete document
GET    /api/bids/{id}/documents/{doc_id}/download/  # Download document
```

#### AI & Analytics
```
POST   /api/bids/{id}/predict/             # Generate predictions
POST   /api/bids/{id}/generate-proposal/   # Generate proposal
POST   /api/bids/{id}/analyze-requirements/ # Analyze requirements
GET    /api/analytics/dashboard/           # Analytics data
```

#### Customer Management
```
GET    /api/bids/customers/          # List customers
POST   /api/bids/customers/          # Create customer
GET    /api/bids/customers/{id}/     # Get customer details
PUT    /api/bids/customers/{id}/     # Update customer
DELETE /api/bids/customers/{id}/     # Delete customer
```

#### Review Management
```
GET    /api/bids/reviews/            # List reviews
POST   /api/bids/reviews/            # Create review
POST   /api/bids/reviews/{id}/complete/  # Complete review
```

## Frontend Features

### Pages & Routes

#### Authentication
- **Login**: `/auth/login` - User authentication
- **Register**: `/auth/register` - New user registration
- **Forgot Password**: `/auth/forgot-password` - Password reset

#### Dashboard
- **Main Dashboard**: `/dashboard` - Overview with analytics
- **Bids List**: `/dashboard/bids` - All bids with filtering
- **Bid Details**: `/dashboard/bids/{id}` - Comprehensive bid view
- **New Bid**: `/dashboard/bids/new` - Create new bid
- **Customers**: `/dashboard/customers` - Customer management
- **Profile**: `/dashboard/profile` - User profile settings

### Key Components

#### BidDocuments Component
```typescript
interface BidDocument {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  upload_date: string;
  uploaded_by: string;
  file_url?: string;
  description?: string;
}

// Features:
- Upload multiple files
- View document list with metadata
- Edit document descriptions
- Download documents
- Delete documents
- Real-time updates
```

#### BidWorkflow Component
```typescript
// Features:
- Visual workflow status tracking
- Status transitions with permissions
- Confirmation dialogs
- Notes and comments
- Real-time status updates
- Role-based access control
```

#### BidAnalysis Component
```typescript
// Features:
- AI-powered requirements analysis
- Win probability predictions
- Risk assessment
- Complexity scoring
- AI recommendations
- Structured requirements display
```

### UI Features

#### Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Dark Mode Support**: Ready for theme switching
- **Accessibility**: WCAG compliant components

#### User Experience
- **Real-time Updates**: Live data synchronization
- **Toast Notifications**: User feedback system
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: Graceful error management

#### Data Visualization
- **Charts**: Analytics with visual representations
- **Progress Bars**: Bid progress tracking
- **Status Indicators**: Color-coded status badges
- **Relationship Scores**: Visual customer metrics

## Complete Functionality

### Document Management System
- **Upload**: Drag-and-drop or click to upload
- **File Types**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, TXT
- **Metadata**: Automatic file type and size detection
- **CRUD Operations**: Create, Read, Update, Delete
- **Security**: File access permissions and validation
- **Storage**: Organized file structure with bid association

### Workflow Management
- **Status Tracking**: 10-stage bid lifecycle
- **Transitions**: Controlled status changes with validation
- **Permissions**: Role-based workflow access
- **Notifications**: Status change alerts
- **History**: Complete audit trail
- **Automation**: AI-powered workflow suggestions

### AI-Powered Features
- **Predictive Analytics**: ML-based win probability
- **Risk Assessment**: Automated risk scoring
- **Requirements Analysis**: Natural language processing
- **Proposal Generation**: AI-assisted content creation
- **Sentiment Analysis**: Review feedback analysis
- **Recommendations**: Actionable insights

### Customer Relationship Management
- **Customer Profiles**: Complete customer information
- **Relationship Scoring**: Quantified relationship metrics
- **Interaction Tracking**: Communication history
- **Classification**: Government, Corporate, SME, Individual
- **Financial Data**: Revenue and credit information
- **Tags and Categories**: Flexible organization

## Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis (optional for development)

### Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd bid-review-system/bid_review_system

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment setup
cp .env.example .env
# Edit .env with your settings

# Database setup
python manage.py migrate
python manage.py createsuperuser

# Optional: Create demo data
python manage.py create_demo_data

# Run server
python manage.py runserver
```

### Frontend Setup
```bash
# Navigate to frontend
cd ../bid-review-frontend

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your settings

# Run development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/bid_review
REDIS_URL=redis://localhost:6379/0  # Optional
GEMINI_API_KEY=your-gemini-api-key
MEDIA_ROOT=media/
MEDIA_URL=media/
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=Bid Review System
```

## API Documentation

### Authentication
All API endpoints require JWT authentication:
```http
Authorization: Bearer <access-token>
```

### Response Format
```json
{
  "data": {},
  "message": "Success",
  "status": 200
}
```

### Error Handling
```json
{
  "error": "Error message",
  "status": 400,
  "details": {}
}
```

## Development Notes

### Redis Usage
- Redis is used for caching and Celery in production
- For local development, Django's in-memory cache is used when `DEBUG=True`
- To enable Redis locally, set `REDIS_URL` and `DEBUG=False`

### File Uploads
- Files are stored in `media/` directory by default
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, TXT
- Maximum file size: 50MB (configurable)
- Automatic virus scanning and validation

### AI Integration
- Google Gemini API for natural language processing
- Custom ML models for predictions
- Fallback to rule-based analysis when AI is unavailable
- All AI features are optional and can be disabled

### Performance Optimizations
- Database indexes on frequently queried fields
- Redis caching for expensive operations
- Lazy loading for large datasets
- Optimized queries with select_related/prefetch_related

## Security Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Manager, User)
- Permission-based endpoint access
- Session management with automatic timeout

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection with Content Security Policy
- File upload security with type validation

### Audit Trail
- Complete user action logging
- Model change tracking
- API request/response logging
- Security event monitoring

## Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test bids
python manage.py test users
python manage.py test analytics
```

### Frontend Tests
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:e2e

# Run linting
npm run lint
```

## Deployment

### Production Deployment
```bash
# Backend
gunicorn bid_review_system.wsgi:application

# Frontend
npm run build
npm start
```

### Docker Deployment
```bash
# Build images
docker-compose build

# Run services
docker-compose up -d