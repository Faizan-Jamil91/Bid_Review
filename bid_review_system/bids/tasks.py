from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Bid, BidAnalytics, Customer
from .ai.gemini_client import GeminiAIClient
from .ml.bid_predictor import BidPredictor

logger = logging.getLogger(__name__)

@shared_task
def update_bid_predictions():
    """Update predictions for all active bids"""
    try:
        active_bids = Bid.objects.exclude(
            status__in=['won', 'lost', 'cancelled']
        ).select_related('customer')
        
        predictor = BidPredictor()
        
        # Try to load existing models, train if not available
        try:
            predictor.load_models()
        except:
            logger.info("Models not found, training new models...")
            predictor.train_models()
        
        updated_count = 0
        for bid in active_bids:
            try:
                prediction = predictor.predict_for_bid(bid)
                
                bid.win_probability = prediction['win_probability'] * 100
                bid.risk_score = prediction['risk_score'] * 100
                bid.ai_recommendations = predictor.get_recommendations(bid, prediction)
                bid.ml_features = prediction['features']
                bid.save(update_fields=[
                    'win_probability', 'risk_score',
                    'ai_recommendations', 'ml_features', 'updated_at'
                ])
                
                updated_count += 1
                
            except Exception as e:
                logger.error(f"Error updating predictions for bid {bid.code}: {e}")
                continue
        
        logger.info(f"Updated predictions for {updated_count} bids")
        return f"Updated {updated_count} bids"
        
    except Exception as e:
        logger.error(f"Error in update_bid_predictions task: {e}")
        raise

@shared_task
def generate_ai_insights():
    """Generate AI insights for critical bids"""
    try:
        critical_bids = Bid.objects.filter(
            priority__in=['critical', 'high'],
            status__in=['draft', 'submitted', 'under_review']
        ).select_related('customer')
        
        ai_client = GeminiAIClient()
        
        if not ai_client.initialized:
            logger.warning("AI client not initialized, skipping insights generation")
            return "AI client not configured"
        
        insights_generated = 0
        for bid in critical_bids:
            try:
                # Generate requirements analysis
                if bid.description:
                    analysis = ai_client.analyze_bid_requirements(bid.description)
                    bid.requirements = analysis
                
                # Generate win probability insights
                bid_features = {
                    'title': bid.title,
                    'description': bid.description[:500],  # Limit length
                    'customer_name': bid.customer.name,
                    'bid_value': float(bid.bid_value or 0),
                }
                
                ai_insights = ai_client.predict_win_probability(bid_features)
                bid.ai_recommendations = ai_insights.get('recommended_actions', [])
                
                bid.save()
                insights_generated += 1
                
            except Exception as e:
                logger.error(f"Error generating insights for bid {bid.code}: {e}")
                continue
        
        logger.info(f"Generated AI insights for {insights_generated} bids")
        return f"Generated insights for {insights_generated} bids"
        
    except Exception as e:
        logger.error(f"Error in generate_ai_insights task: {e}")
        raise

@shared_task
def train_ml_models():
    """Train ML models on schedule"""
    try:
        predictor = BidPredictor()
        predictor.train_models(retrain=True)
        
        logger.info("ML models trained successfully")
        return "Models trained successfully"
        
    except Exception as e:
        logger.error(f"Error training ML models: {e}")
        raise

@shared_task
def update_customer_analytics():
    """Update customer relationship analytics"""
    try:
        customers = Customer.objects.all()
        
        for customer in customers:
            try:
                # Calculate win rate
                customer_bids = Bid.objects.filter(customer=customer)
                total_bids = customer_bids.count()
                
                if total_bids > 0:
                    won_bids = customer_bids.filter(status__in=['won', 'approved']).count()
                    win_rate = (won_bids / total_bids) * 100
                    
                    # Calculate average bid value
                    avg_bid_value = customer_bids.aggregate(
                        avg=Avg('bid_value')
                    )['avg'] or 0
                    
                    # Update customer relationship score based on win rate
                    customer.relationship_score = int(win_rate)
                    customer.save()
                
            except Exception as e:
                logger.error(f"Error updating analytics for customer {customer.name}: {e}")
                continue
        
        logger.info(f"Updated analytics for {customers.count()} customers")
        return f"Updated {customers.count()} customers"
        
    except Exception as e:
        logger.error(f"Error in update_customer_analytics task: {e}")
        raise