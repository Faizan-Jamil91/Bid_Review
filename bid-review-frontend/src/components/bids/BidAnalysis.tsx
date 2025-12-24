'use client';

import React, { useState } from 'react';
import { Bid } from '../../types/review';

interface BidAnalysisProps {
  bid: Bid;
  onAnalysisComplete?: (updatedBid: Bid) => void;
}

const BidAnalysis: React.FC<BidAnalysisProps> = ({ bid, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<Bid | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeRequirements = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('Starting AI analysis for bid:', bid.id);
      
      // Call the real API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/bids/${bid.id}/analyze-requirements/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          requirements: bid.requirements || '',
          description: bid.description || '',
          title: bid.title || '',
          bid_value: bid.bid_value || 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze requirements');
      }

      const result = await response.json();
      console.log('AI analysis completed:', result);
      
      // Transform the API response to match expected format
      const transformedResult = {
        ...bid,
        win_probability: result.win_probability || (result.combined_win_probability ? result.combined_win_probability * 100 : null),
        risk_score: result.risk_assessment?.risk_score || null,
        complexity_score: result.requirements_analysis?.complexity_level === 'high' ? 80 : 
                         result.requirements_analysis?.complexity_level === 'medium' ? 60 : 40,
        ai_recommendations: result.ai_insights?.recommended_actions || result.recommendations || null,
        requirements: result.requirements_analysis || null,
        ml_features: result.ml_predictions || null,
        updated_at: new Date().toISOString()
      };
      
      setAnalysisResult(transformedResult);
      onAnalysisComplete?.(transformedResult);
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      setError(error.message || 'Failed to analyze requirements. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysisScoreColor = (score?: string | null) => {
    if (!score) return 'text-gray-500';
    const numScore = parseFloat(score);
    if (numScore >= 80) return 'text-green-600';
    if (numScore >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAnalysisScoreLabel = (label: string, score?: string | null) => {
    if (!score) return `${label}: Not analyzed`;
    const numScore = parseFloat(score);
    return `${label}: ${numScore.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Requirements Analysis</h3>
        <button
          onClick={handleAnalyzeRequirements}
          disabled={isAnalyzing}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isAnalyzing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Requirements'
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6">
          {/* Analysis Scores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className={`text-2xl font-bold ${getAnalysisScoreColor(analysisResult.win_probability?.toString())}`}>
                {analysisResult.win_probability !== null && analysisResult.win_probability !== undefined 
                  ? `${analysisResult.win_probability.toFixed(1)}%` 
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Win Probability</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className={`text-2xl font-bold ${getAnalysisScoreColor(analysisResult.risk_score?.toString())}`}>
                {analysisResult.risk_score !== null && analysisResult.risk_score !== undefined 
                  ? `${analysisResult.risk_score.toFixed(1)}` 
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Risk Score</div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className={`text-2xl font-bold ${getAnalysisScoreColor(analysisResult.complexity_score?.toString())}`}>
                {analysisResult.complexity_score !== null && analysisResult.complexity_score !== undefined 
                  ? `${analysisResult.complexity_score.toFixed(1)}` 
                  : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Complexity Score</div>
            </div>
          </div>

          {/* AI Recommendations */}
          {analysisResult.ai_recommendations && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">AI Recommendations</h4>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-800 text-sm whitespace-pre-wrap">
                  {typeof analysisResult.ai_recommendations === 'string' 
                    ? analysisResult.ai_recommendations 
                    : typeof analysisResult.ai_recommendations === 'object' && analysisResult.ai_recommendations !== null
                    ? JSON.stringify(analysisResult.ai_recommendations, null, 2)
                    : String(analysisResult.ai_recommendations || 'N/A')}
                </div>
              </div>
            </div>
          )}

          {/* Structured Requirements */}
          {analysisResult.requirements && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Structured Requirements</h4>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-800 text-sm whitespace-pre-wrap">
                  {typeof analysisResult.requirements === 'string' 
                    ? analysisResult.requirements 
                    : typeof analysisResult.requirements === 'object' && analysisResult.requirements !== null
                    ? JSON.stringify(analysisResult.requirements, null, 2)
                    : String(analysisResult.requirements || 'N/A')}
                </div>
              </div>
            </div>
          )}

          {/* ML Features */}
          {analysisResult.ml_features && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">ML Analysis Features</h4>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-800 text-sm font-mono">
                  {typeof analysisResult.ml_features === 'string' 
                    ? analysisResult.ml_features 
                    : typeof analysisResult.ml_features === 'object' && analysisResult.ml_features !== null
                    ? JSON.stringify(analysisResult.ml_features, null, 2)
                    : String(analysisResult.ml_features || 'N/A')}
                </div>
              </div>
            </div>
          )}

          {/* Analysis Timestamp */}
          <div className="text-xs text-gray-500 text-right">
            Last analyzed: {new Date(analysisResult.updated_at).toLocaleString()}
          </div>
        </div>
      )}

      {!analysisResult && !isAnalyzing && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>Click "Analyze Requirements" to get AI-powered insights about this bid</p>
        </div>
      )}
    </div>
  );
};

export default BidAnalysis;
