'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BidReviewForm from '../../../components/reviews/BidReviewForm';
import BidReviewList from '../../../components/reviews/BidReviewList';
import { BidReview } from '../../../types/review';

const ReviewsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<BidReview | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleEdit = (review: BidReview) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingReview(null);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bid Reviews</h1>
            <p className="mt-2 text-gray-600">Manage and track bid reviews</p>
          </div>

          {/* Actions */}
          <div className="mb-6">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Create New Review
              </button>
            )}
          </div>

          {/* Content */}
          {showForm ? (
            <BidReviewForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCancel}
              initialData={editingReview ? {
                bid: editingReview.bid,
                review_type: editingReview.review_type,
                sequence: editingReview.sequence,
                assigned_to: editingReview.assigned_to || undefined,
                assigned_to_detail: editingReview.assigned_to_detail || undefined,
                reviewed_by: editingReview.reviewed_by || undefined,
                reviewed_by_detail: editingReview.reviewed_by_detail || undefined,
                due_date: editingReview.due_date,
                completed_date: editingReview.completed_date || undefined,
                status: editingReview.status,
                decision: editingReview.decision || undefined,
                score: editingReview.score || undefined,
                strengths: editingReview.strengths,
                weaknesses: editingReview.weaknesses,
                recommendations: editingReview.recommendations,
                comments: editingReview.comments,
                ai_analysis: editingReview.ai_analysis,
                ai_suggestions: editingReview.ai_suggestions,
                sentiment_score: editingReview.sentiment_score || undefined,
                is_mandatory: editingReview.is_mandatory,
                requires_signature: editingReview.requires_signature,
              } : undefined}
            />
          ) : (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">All Reviews</h2>
              </div>
              <div className="p-6">
                <BidReviewList
                  onEdit={handleEdit}
                  onRefresh={handleRefresh}
                  refreshKey={refreshKey}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ReviewsPage;
