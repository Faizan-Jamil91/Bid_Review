import React, { useState, useEffect } from 'react';
import { getBidReviews, deleteReview } from '../../services/reviewService';
import { BidReview } from '../../types/review';

interface BidReviewListProps {
  bidId?: string;
  onEdit?: (review: BidReview) => void;
  onRefresh?: () => void;
  refreshKey?: number;
}

const BidReviewList: React.FC<BidReviewListProps> = ({ 
  bidId, 
  onEdit, 
  onRefresh,
  refreshKey 
}) => {
  const [reviews, setReviews] = useState<BidReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReviews();
  }, [bidId, refreshKey]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const params = bidId ? { bid: bidId } : {};
      const response = await getBidReviews(params);
      setReviews(response.results || response);
      setError(null);
    } catch (err: any) {
      // Don't show error for 401 - let the ProtectedRoute handle authentication
      if (err.response?.status !== 401) {
        setError(err.message || 'Failed to load reviews');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await deleteReview(reviewId);
      setReviews(reviews.filter(review => review.id !== reviewId));
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Failed to delete review');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getDecisionBadge = (decision: string | null) => {
    if (!decision) return null;

    const decisionStyles = {
      approved: 'bg-green-100 text-green-800',
      approved_comments: 'bg-green-100 text-green-800',
      modifications_required: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${decisionStyles[decision as keyof typeof decisionStyles] || 'bg-gray-100 text-gray-800'}`}>
        {decision.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
        <button
          onClick={loadReviews}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {review.review_type.replace('_', ' ').toUpperCase()} Review
              </h3>
              <p className="text-sm text-gray-600">
                Bid: {review.bid_code} - {review.bid_title}
              </p>
            </div>
            <div className="flex space-x-2">
              {getStatusBadge(review.status)}
              {getDecisionBadge(review.decision)}
            </div>
          </div>

          {/* Review Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="text-sm font-medium">
                {review.assigned_to_detail 
                  ? `${review.assigned_to_detail.first_name} ${review.assigned_to_detail.last_name}`
                  : 'Not assigned'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Reviewed By</p>
              <p className="text-sm font-medium">
                {review.reviewed_by_detail 
                  ? `${review.reviewed_by_detail.first_name} ${review.reviewed_by_detail.last_name}`
                  : 'Not reviewed'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-sm font-medium">
                {new Date(review.due_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Date</p>
              <p className="text-sm font-medium">
                {review.completed_date 
                  ? new Date(review.completed_date).toLocaleDateString()
                  : 'Not completed'
                }
              </p>
            </div>
          </div>

          {/* Score and Sentiment */}
          {(review.score !== null || review.sentiment_score !== null) && (
            <div className="flex space-x-6 mb-4">
              {review.score !== null && (
                <div>
                  <p className="text-sm text-gray-500">Score</p>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold">{review.score}</span>
                    <span className="text-sm text-gray-500 ml-1">/100</span>
                  </div>
                </div>
              )}
              {review.sentiment_score !== null && (
                <div>
                  <p className="text-sm text-gray-500">Sentiment Score</p>
                  <div className="flex items-center">
                    <span className="text-lg font-semibold">{review.sentiment_score}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Review Content */}
          {(review.strengths || review.weaknesses || review.recommendations || review.comments) && (
            <div className="space-y-3 mb-4">
              {review.strengths && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Strengths</p>
                  <p className="text-sm text-gray-600">{review.strengths}</p>
                </div>
              )}
              {review.weaknesses && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Weaknesses</p>
                  <p className="text-sm text-gray-600">{review.weaknesses}</p>
                </div>
              )}
              {review.recommendations && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Recommendations</p>
                  <p className="text-sm text-gray-600">{review.recommendations}</p>
                </div>
              )}
              {review.comments && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Comments</p>
                  <p className="text-sm text-gray-600">{review.comments}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => handleDelete(review.id)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BidReviewList;
