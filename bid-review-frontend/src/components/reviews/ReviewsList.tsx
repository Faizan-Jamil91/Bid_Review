import React, { useState, useEffect } from 'react';
import { getBidReviews } from '../../services/reviewService';

interface ReviewsListProps {
  bidId?: string;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ bidId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const params = bidId ? { bid: bidId } : {};
        const response = await getBidReviews(params);
        setReviews(response.results || response);
      } catch (err: any) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [bidId]);

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getDecisionBadge = (decision: string) => {
    if (!decision) return null;
    const decisionStyles: Record<string, string> = {
      approved: 'bg-green-100 text-green-800',
      approved_comments: 'bg-blue-100 text-blue-800',
      modifications_required: 'bg-orange-100 text-orange-800',
      rejected: 'bg-red-100 text-red-800',
      escalated: 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${decisionStyles[decision] || 'bg-gray-100 text-gray-800'}`}>
        {decision.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <i className="fas fa-spinner fa-spin text-blue-600 text-2xl"></i>
        <span className="ml-3 text-gray-600">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <i className="fas fa-exclamation-triangle text-red-600 text-2xl mb-2"></i>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <i className="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Found</h3>
        <p className="text-gray-500 mb-4">
          {bidId ? 'This bid has no reviews yet.' : 'No reviews found in the system.'}
        </p>
        <button
          onClick={() => window.location.href = '/reviews/new'}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create First Review
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {bidId ? 'Bid Reviews' : 'All Reviews'}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/reviews/new'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Create Review
          </button>
          <button
            onClick={() => window.location.href = bidId ? `/reviews/new?bid=${bidId}` : '/reviews/new'}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
          >
            <i className="fas fa-robot"></i>
            AI Review
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Insights</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reviews.map((review: any) => (
              <tr key={review.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{review.bid_code}</div>
                    <div className="text-sm text-gray-500">{review.bid_title}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900 capitalize">{review.review_type.replace('_', ' ')}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {review.assigned_to_detail ? (
                      `${review.assigned_to_detail.first_name} ${review.assigned_to_detail.last_name}`
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </div>
                  {review.reviewed_by_detail && (
                    <div className="text-xs text-gray-500">
                      Reviewed by: {review.reviewed_by_detail.first_name} {review.reviewed_by_detail.last_name}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(review.status)}
                  {review.decision && getDecisionBadge(review.decision)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {review.score !== null && review.score !== undefined ? (
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{review.score}/100</div>
                      <div className={`ml-2 w-2 h-2 rounded-full ${
                        review.score >= 80 ? 'bg-green-500' :
                        review.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {review.ai_analysis && Object.keys(review.ai_analysis).length > 0 && (
                      <div className="flex items-center text-xs text-blue-600">
                        <i className="fas fa-brain mr-1"></i>
                        AI Analysis Available
                      </div>
                    )}
                    {review.sentiment_score && (
                      <div className="flex items-center text-xs">
                        <span className="mr-1">Sentiment:</span>
                        <div className={`w-2 h-2 rounded-full ${
                          parseFloat(review.sentiment_score) > 0.5 ? 'bg-green-500' :
                          parseFloat(review.sentiment_score) > 0 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <span className="ml-1">{review.sentiment_score}</span>
                      </div>
                    )}
                    {review.ai_suggestions && (
                      <div className="flex items-center text-xs text-purple-600">
                        <i className="fas fa-lightbulb mr-1"></i>
                        AI Suggestions
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(review.due_date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => window.location.href = `/reviews/${review.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    title="View details"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    onClick={() => window.location.href = `/reviews/${review.id}/edit`}
                    className="text-green-600 hover:text-green-900 mr-3"
                    title="Edit review"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewsList;
