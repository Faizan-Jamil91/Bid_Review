import React, { memo } from 'react';
import AIReviewButton from './reviews/AIReviewButton';

const BidRow = memo(({ bid, getStatusBadge, formatDate, onReviewSuccess, onMilestonesClick }) => {
  const handleReviewSuccess = (review) => {
    console.log('AI Review created successfully:', review);
    if (onReviewSuccess) {
      onReviewSuccess(review);
    } else {
      // Optional: Refresh the page or update state
      window.location.reload();
    }
  };

  return (
    <tr className="border-t hover:bg-gray-50">
      <td className="py-3 px-4">{bid.code || 'N/A'}</td>
      <td className="py-3 px-4 font-medium">{bid.title}</td>
      <td className="py-3 px-4">
        {bid.customer_detail?.name || 'N/A'}
      </td>
      <td className="py-3 px-4">
        {getStatusBadge(typeof bid.status === 'string' ? bid.status.toLowerCase() : 'draft')}
        {bid.is_urgent && (
          <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">
            Urgent
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-right">
        {bid.bid_value ? (
          <>
            {bid.currency || '$'}
            {parseFloat(bid.bid_value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </>
        ) : 'N/A'}
      </td>
      <td className={`py-3 px-4 ${bid.is_overdue ? 'text-red-600 font-medium' : ''}`}>
        {formatDate(bid.bid_due_date)}
        {bid.is_overdue && (
          <div className="text-xs text-red-500">Overdue</div>
        )}
      </td>
      <td className="py-3 px-4">
        {bid.business_unit || 'N/A'}
      </td>
      <td className="py-3 px-4 text-center">
        <a 
          href={`/bids/${bid.id}`}
          className="text-blue-600 hover:text-blue-800 mr-3"
          title="View details"
        >
          <i className="fas fa-eye"></i>
        </a>
        <a 
          href={`/bids/${bid.id}/edit`}
          className="text-blue-600 hover:text-blue-800 mr-3"
          title="Edit bid"
        >
          <i className="fas fa-edit"></i>
        </a>
        <button
          onClick={() => onMilestonesClick?.(bid.id)}
          className="text-orange-600 hover:text-orange-800 mr-3"
          title="View milestones"
        >
          <i className="fas fa-flag"></i>
        </button>
        <a 
          href={`/bids/${bid.id}/reviews`}
          className="text-green-600 hover:text-green-800 mr-3"
          title="View reviews"
        >
          <i className="fas fa-clipboard-check"></i>
        </a>
        <button
          onClick={() => window.location.href = `/reviews/new?bid=${bid.id}`}
          className="text-purple-600 hover:text-purple-800 mr-3"
          title="Create review for this bid"
        >
          <i className="fas fa-plus-circle"></i>
        </button>
        <AIReviewButton 
          bidId={bid.id} 
          onSuccess={handleReviewSuccess}
        />
      </td>
    </tr>
  );
});

BidRow.displayName = 'BidRow';

export default BidRow;
