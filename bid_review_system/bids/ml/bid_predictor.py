import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
import os

from django.conf import settings
from bids.models import Bid, Customer
from django.db.models import Count, Avg

logger = logging.getLogger(__name__)

class BidPredictor:
    """Machine Learning model for bid prediction"""
    
    def __init__(self):
        self.win_predictor = None
        self.risk_predictor = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.model_path = settings.ML_MODELS_DIR
        self.model_path.mkdir(parents=True, exist_ok=True)
    
    def prepare_training_data(self) -> pd.DataFrame:
        """Prepare training data from historical bids"""
        bids = Bid.objects.filter(
            status__in=['won', 'lost', 'approved', 'rejected']
        ).select_related('customer', 'requested_by')
        
        data = []
        for bid in bids:
            features = self._extract_features(bid)
            features['target'] = 1 if bid.status in ['won', 'approved'] else 0
            features['bid_id'] = str(bid.id)
            data.append(features)
        
        return pd.DataFrame(data)
    
    def _extract_features(self, bid: Bid) -> Dict[str, Any]:
        """Extract features from bid for ML"""
        customer = bid.customer
        
        # Calculate historical win rate for customer
        customer_bids = Bid.objects.filter(customer=customer)
        total_bids = customer_bids.count()
        if total_bids > 0:
            won_bids = customer_bids.filter(status__in=['won', 'approved']).count()
            historical_win_rate = won_bids / total_bids
        else:
            historical_win_rate = 0.5
        
        # Calculate average bid value for customer
        avg_bid_value = customer_bids.aggregate(avg=Avg('bid_value'))['avg'] or 0
        
        features = {
            # Bid characteristics
            'bid_value': float(bid.bid_value or 0),
            'estimated_cost': float(bid.estimated_cost or 0),
            'profit_margin': float(bid.profit_margin or 0),
            'days_until_due': bid.days_until_due or 0,
            'complexity_score': float(bid.complexity_score or 0.5),
            
            # Customer features
            'customer_relationship_score': float(customer.relationship_score),
            'customer_annual_revenue': float(customer.annual_revenue or 0),
            'customer_type': customer.customer_type,
            'customer_industry': customer.industry or 'unknown',
            
            # Historical features
            'historical_win_rate': historical_win_rate,
            'avg_bid_value': avg_bid_value,
            
            # Team features
            'team_size': bid.team_members.count() + 1,
            
            # Timing features
            'review_cycle_count': bid.review_cycle,
            
            # Text features (simplified)
            'description_length': len(bid.description),
            'requirements_count': len(bid.requirements) if bid.requirements else 0,
            
            # Categorical features
            'business_unit': bid.business_unit,
            'bid_level': bid.bid_level,
            'priority': bid.priority,
            'complexity': bid.complexity,
            'region': bid.region,
        }
        
        return features
    
    def train_models(self, retrain: bool = False):
        """Train ML models"""
        if not retrain and self._models_exist():
            self.load_models()
            return
        
        # Prepare data
        df = self.prepare_training_data()
        if df.empty or len(df) < 10:
            logger.warning("Not enough training data available")
            return
        
        # Prepare features and target
        X = df.drop(['target', 'bid_id'], axis=1)
        y = df['target']
        
        # Encode categorical features
        X_encoded = self._encode_features(X)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X_encoded)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train win predictor
        self.win_predictor = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.win_predictor.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.win_predictor.predict(X_test)
        y_pred_binary = (y_pred > 0.5).astype(int)
        
        if len(y_test.unique()) > 1:
            accuracy = accuracy_score(y_test, y_pred_binary)
            precision = precision_score(y_test, y_pred_binary)
            recall = recall_score(y_test, y_pred_binary)
            f1 = f1_score(y_test, y_pred_binary)
            
            logger.info(f"Model Performance: Accuracy={accuracy:.3f}, Precision={precision:.3f}, "
                       f"Recall={recall:.3f}, F1={f1:.3f}")
        else:
            logger.info("Only one class in test data")
        
        # Train risk predictor
        risk_scores = self._calculate_risk_scores(df)
        self.risk_predictor = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.risk_predictor.fit(X_train, risk_scores)
        
        # Save models
        self.save_models()
        
        # Save feature importance
        self._save_feature_importance(X.columns)
    
    def _encode_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Encode categorical features"""
        X_encoded = X.copy()
        
        for column in X_encoded.select_dtypes(include=['object']).columns:
            if column not in self.label_encoders:
                self.label_encoders[column] = LabelEncoder()
                X_encoded[column] = self.label_encoders[column].fit_transform(X_encoded[column].fillna('unknown'))
            else:
                X_encoded[column] = self.label_encoders[column].transform(X_encoded[column].fillna('unknown'))
        
        return X_encoded
    
    def _calculate_risk_scores(self, df: pd.DataFrame) -> np.ndarray:
        """Calculate risk scores for training"""
        risks = []
        for _, row in df.iterrows():
            risk = 0.0
            
            # High value bids are riskier
            if row['bid_value'] > 1000000:
                risk += 0.3
            
            # Low customer relationship score increases risk
            if row['customer_relationship_score'] < 30:
                risk += 0.2
            
            # Complex bids are riskier
            if row['complexity_score'] > 0.7:
                risk += 0.2
            
            # Urgent bids are riskier
            if row['days_until_due'] < 7:
                risk += 0.2
            
            # Limit to 0-1 range
            risk = min(max(risk, 0), 1)
            risks.append(risk)
        
        return np.array(risks)
    
    def predict_for_bid(self, bid: Bid) -> Dict[str, Any]:
        """Predict win probability and risk for a bid"""
        if self.win_predictor is None:
            try:
                self.load_models()
            except:
                return self._get_default_prediction()
        
        features = self._extract_features(bid)
        features_df = pd.DataFrame([features])
        
        try:
            # Encode features
            for column in features_df.select_dtypes(include=['object']).columns:
                if column in self.label_encoders:
                    features_df[column] = self.label_encoders[column].transform(
                        [features_df[column].iloc[0]]
                    )
            
            # Scale features
            features_scaled = self.scaler.transform(features_df)
            
            # Make predictions
            win_probability = float(self.win_predictor.predict(features_scaled)[0])
            risk_score = float(self.risk_predictor.predict(features_scaled)[0])
            
            # Calculate confidence
            confidence = 0.8  # Default confidence
            
            return {
                'win_probability': win_probability,
                'risk_score': risk_score,
                'confidence': confidence,
                'features': features,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error predicting for bid: {e}")
            return self._get_default_prediction()
    
    def get_recommendations(self, bid: Bid, prediction: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on predictions"""
        recommendations = []
        
        if prediction['win_probability'] < 0.3:
            recommendations.extend([
                "Consider revising bid strategy",
                "Strengthen customer relationship",
                "Review pricing strategy",
                "Enhance technical proposal"
            ])
        elif prediction['win_probability'] < 0.6:
            recommendations.extend([
                "Focus on key differentiators",
                "Clarify scope and deliverables",
                "Strengthen risk mitigation plan",
                "Review competitive positioning"
            ])
        
        if prediction['risk_score'] > 0.7:
            recommendations.extend([
                "Implement enhanced risk monitoring",
                "Develop contingency plans",
                "Increase management oversight"
            ])
        
        # Add specific recommendations based on features
        features = prediction.get('features', {})
        if features.get('customer_relationship_score', 0) < 40:
            recommendations.append("Schedule customer engagement meetings")
        
        if features.get('days_until_due', 0) < 14:
            recommendations.append("Accelerate review and approval process")
        
        return list(set(recommendations))
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            joblib.dump(self.win_predictor, self.model_path / 'win_predictor.pkl')
            joblib.dump(self.risk_predictor, self.model_path / 'risk_predictor.pkl')
            joblib.dump(self.scaler, self.model_path / 'scaler.pkl')
            joblib.dump(self.label_encoders, self.model_path / 'label_encoders.pkl')
            
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Error saving models: {e}")
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            self.win_predictor = joblib.load(self.model_path / 'win_predictor.pkl')
            self.risk_predictor = joblib.load(self.model_path / 'risk_predictor.pkl')
            self.scaler = joblib.load(self.model_path / 'scaler.pkl')
            self.label_encoders = joblib.load(self.model_path / 'label_encoders.pkl')
            
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def _models_exist(self) -> bool:
        """Check if models exist on disk"""
        files = [
            'win_predictor.pkl',
            'risk_predictor.pkl',
            'scaler.pkl',
            'label_encoders.pkl'
        ]
        
        return all((self.model_path / f).exists() for f in files)
    
    def _save_feature_importance(self, feature_names):
        """Save feature importance analysis"""
        if self.win_predictor is None:
            return
        
        try:
            importance = self.win_predictor.feature_importances_
            feature_importance = dict(zip(feature_names, importance))
            
            # Sort by importance
            sorted_importance = dict(sorted(
                feature_importance.items(),
                key=lambda x: x[1],
                reverse=True
            ))
            
            # Save to file
            importance_file = self.model_path / 'feature_importance.json'
            with open(importance_file, 'w') as f:
                json.dump(sorted_importance, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving feature importance: {e}")
    
    def _get_default_prediction(self) -> Dict[str, Any]:
        """Return default prediction in case of errors"""
        return {
            'win_probability': 0.5,
            'risk_score': 0.5,
            'confidence': 0.5,
            'features': {},
        }
    
    def get_model_status(self, model_name: str) -> Dict[str, Any]:
        """Get status of a specific model"""
        try:
            model_file = self.model_path / f'{model_name}.pkl'
            
            if not model_file.exists():
                return {
                    'name': model_name,
                    'status': 'error',
                    'accuracy': None,
                    'last_trained': None,
                    'version': None
                }
            
            # Try to load model and get metadata
            try:
                if model_name == 'win_predictor' and self.win_predictor:
                    model = self.win_predictor
                elif model_name == 'risk_predictor' and self.risk_predictor:
                    model = self.risk_predictor
                else:
                    # Load from disk if not in memory
                    model = joblib.load(model_file)
                
                # Get file modification time as last trained
                last_trained = datetime.fromtimestamp(model_file.stat().st_mtime).isoformat()
                
                return {
                    'name': model_name,
                    'status': 'trained',
                    'accuracy': getattr(model, 'score_', None),
                    'last_trained': last_trained,
                    'version': '1.0'
                }
                
            except Exception as e:
                logger.error(f"Error loading model {model_name}: {e}")
                return {
                    'name': model_name,
                    'status': 'error',
                    'accuracy': None,
                    'last_trained': None,
                    'version': None
                }
                
        except Exception as e:
            logger.error(f"Error getting model status for {model_name}: {e}")
            return {
                'name': model_name,
                'status': 'error',
                'accuracy': None,
                'last_trained': None,
                'version': None
            }
    
    def get_last_training_time(self) -> Optional[str]:
        """Get the last training time from model files"""
        try:
            model_files = [
                self.model_path / 'win_predictor.pkl',
                self.model_path / 'risk_predictor.pkl'
            ]
            
            latest_time = None
            for model_file in model_files:
                if model_file.exists():
                    file_time = datetime.fromtimestamp(model_file.stat().st_mtime)
                    if latest_time is None or file_time > latest_time:
                        latest_time = file_time
            
            return latest_time.isoformat() if latest_time else None
            
        except Exception as e:
            logger.error(f"Error getting last training time: {e}")
            return None