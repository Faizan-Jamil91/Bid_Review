from google import genai
from google.genai import types
from django.conf import settings
import logging
from typing import Optional, Dict, Any, List
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class GeminiAIClient:
    """Google Generative AI Client for Bid Management"""
    
    def __init__(self):
        self.api_key = settings.GOOGLE_AI_API_KEY
        if not self.api_key:
            logger.warning("GOOGLE_AI_API_KEY not configured")
            return
        
        try:
            self.client = genai.Client(api_key=self.api_key)
            self.model_name = 'gemini-2.0-flash'
            
            # Configure generation parameters
            self.generation_config = types.GenerateContentConfig(
                temperature=0.2,
                top_p=0.8,
                top_k=40,
                max_output_tokens=2048,
            )
            
            self.safety_settings = [
                types.HarmCategory(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                ),
                types.HarmCategory(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                ),
                types.HarmCategory(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                ),
                types.HarmCategory(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
                )
            ]
            self.initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize Gemini AI: {e}")
            self.initialized = False
    
    def analyze_bid_requirements(self, requirements_text: str) -> Dict[str, Any]:
        """Analyze bid requirements using AI"""
        if not self.initialized:
            return self._get_default_analysis()
        
        prompt = f"""
        Analyze the following bid requirements and provide structured insights:
        
        Requirements:
        {requirements_text}
        
        Provide analysis in the following JSON format:
        {{
            "key_requirements": ["list of key requirements"],
            "technical_requirements": ["list of technical specifications"],
            "commercial_requirements": ["list of commercial terms"],
            "timeline_requirements": ["list of timeline constraints"],
            "compliance_requirements": ["list of compliance needs"],
            "complexity_level": "low/medium/high",
            "estimated_effort": "rough estimate in person-months",
            "risk_factors": ["list of potential risks"],
            "recommended_approach": "brief approach recommendation"
        }}
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )
            
            # Parse JSON response
            analysis = json.loads(response.text)
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing bid requirements: {e}")
            return self._get_default_analysis()
    
    def generate_proposal_sections(self, bid_data: Dict[str, Any]) -> Dict[str, str]:
        """Generate proposal sections using AI"""
        if not self.initialized:
            return {}
        
        prompt = f"""
        Generate professional proposal sections for the following bid:
        
        Bid Title: {bid_data.get('title', '')}
        Description: {bid_data.get('description', '')}
        Requirements: {json.dumps(bid_data.get('requirements', {}))}
        Customer: {bid_data.get('customer_name', '')}
        
        Generate the following sections:
        1. Executive Summary
        2. Technical Approach
        3. Project Methodology
        4. Team Structure
        5. Timeline and Milestones
        6. Commercial Proposal
        7. Risk Management
        8. Company Capabilities
        
        For each section, provide 3-5 paragraphs of professional content.
        Format the response as JSON with section names as keys.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )
            
            sections = json.loads(response.text)
            return sections
            
        except Exception as e:
            logger.error(f"Error generating proposal sections: {e}")
            return {}
    
    def predict_win_probability(self, bid_features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict win probability and provide insights"""
        if not self.initialized:
            return self._get_default_prediction()
        
        prompt = f"""
        Analyze the following bid features and predict win probability:
        
        Features:
        {json.dumps(bid_features, indent=2)}
        
        Consider factors like:
        - Customer relationship history
        - Bid value and complexity
        - Competitive landscape
        - Team experience
        - Past performance on similar bids
        
        Provide analysis in JSON format:
        {{
            "win_probability": 0.85,
            "confidence_score": 0.92,
            "key_strengths": ["list of strengths"],
            "key_weaknesses": ["list of weaknesses"],
            "recommended_actions": ["list of actions to improve chances"],
            "competitive_analysis": "analysis of competitive position",
            "pricing_recommendation": "suggested pricing strategy"
        }}
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )
            
            prediction = json.loads(response.text)
            return prediction
            
        except Exception as e:
            logger.error(f"Error predicting win probability: {e}")
            return self._get_default_prediction()
    
    def analyze_review_feedback(self, feedback_text: str) -> Dict[str, Any]:
        """Analyze review feedback and extract insights"""
        if not self.initialized:
            return {}
        
        prompt = f"""
        Analyze the following bid review feedback:
        
        Feedback:
        {feedback_text}
        
        Extract:
        1. Main concerns and issues
        2. Positive aspects
        3. Action items
        4. Risk areas
        5. Recommendations
        
        Format as JSON with structured analysis.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )
            
            analysis = json.loads(response.text)
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing review feedback: {e}")
            return {}
    
    def generate_executive_summary(self, bid_data: Dict[str, Any]) -> str:
        """Generate executive summary for bid"""
        if not self.initialized:
            return ""
        
        prompt = f"""
        Generate a concise executive summary for a bid proposal:
        
        Bid Information:
        - Title: {bid_data.get('title', '')}
        - Customer: {bid_data.get('customer_name', '')}
        - Value: {bid_data.get('bid_value', '')}
        - Key Requirements: {bid_data.get('key_requirements', [])}
        
        Our Solution:
        - Approach: {bid_data.get('approach', '')}
        - Key Differentiators: {bid_data.get('differentiators', [])}
        - Expected Outcomes: {bid_data.get('outcomes', [])}
        
        Generate a 3-paragraph executive summary suitable for senior management.
        """
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self.generation_config
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error generating executive summary: {e}")
            return ""
    
    def _get_default_analysis(self) -> Dict[str, Any]:
        """Return default analysis in case of errors"""
        return {
            "key_requirements": [],
            "technical_requirements": [],
            "commercial_requirements": [],
            "timeline_requirements": [],
            "compliance_requirements": [],
            "complexity_level": "medium",
            "estimated_effort": "Not estimated",
            "risk_factors": ["Unable to analyze"],
            "recommended_approach": "Standard approach recommended"
        }
    
    def _get_default_prediction(self) -> Dict[str, Any]:
        """Return default prediction in case of errors"""
        return {
            "win_probability": 0.5,
            "confidence_score": 0.5,
            "key_strengths": ["Unable to analyze"],
            "key_weaknesses": ["Unable to analyze"],
            "recommended_actions": ["Review bid details manually"],
            "competitive_analysis": "Unable to analyze",
            "pricing_recommendation": "Standard pricing recommended"
        }
