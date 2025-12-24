import React, { useState, useEffect } from 'react';
import { createBidReview, validateReviewData } from '../../services/reviewService';
import { getBids } from '../../services/bidService';
import { getUsers, User as UserServiceUser } from '@/services/userService';
import { CreateBidReviewRequest, ValidationError, User, Bid } from '../../types/review';
import { api } from '../../lib/api/client';

interface BidReviewFormProps {
  onSuccess?: (review: any) => void;
  onCancel?: () => void;
  initialData?: Partial<CreateBidReviewRequest>;
}

const BidReviewForm: React.FC<BidReviewFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialData = {} 
}) => {
  const [formData, setFormData] = useState<CreateBidReviewRequest>({
    bid: '',
    review_type: '',
    sequence: 1,
    assigned_to: undefined,
    reviewed_by: undefined,
    due_date: '',
    status: 'pending',
    score: undefined,
    strengths: '',
    weaknesses: '',
    recommendations: '',
    comments: '',
    sentiment_score: undefined,
    is_mandatory: true,
    requires_signature: false,
    ...initialData
  });

  const [bids, setBids] = useState<Bid[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadBids();
    loadUsers();
    
    // Check for bid ID in URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const bidId = urlParams.get('bid');
    if (bidId) {
      setFormData(prev => ({
        ...prev,
        bid: bidId
      }));
    }
  }, []);

  const loadBids = async () => {
    try {
      console.log('Loading bids...');
      const response = await getBids();
      console.log('Bids loaded:', response);
      setBids(response.results || response);
    } catch (error: any) {
      console.error('Error loading bids:', error);
      // Don't throw error for 401 - let the ProtectedRoute handle authentication
      if (error.response?.status !== 401) {
        setErrors(prev => [...prev, { field: 'general', message: 'Failed to load bids' }]);
      }
    }
  };

  const loadUsers = async () => {
    try {
      console.log('Loading users...');
      const response = await getUsers();
      console.log('Users response:', response);
      const usersData = response.results || response;
      console.log('Users data:', usersData);
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Fallback: add current user to the list if API fails
      try {
        const currentUserResponse = await api.getCurrentUser();
        const currentUser = currentUserResponse;
        console.log('Current user as fallback:', currentUser);
        setUsers([currentUser]);
      } catch (profileError) {
        console.error('Failed to get current user profile:', profileError);
        
        // Final fallback: create a test user list for debugging
        console.log('Using test user list as final fallback');
        setUsers([
          {
            id: 'test-1',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            username: 'admin',
            role: 'admin'
          }
        ]);
      }
      
      // Don't show error for 401/403 - let the ProtectedRoute handle authentication
      // For 403 (permission denied), it means user is not admin
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        setErrors(prev => [...prev, { field: 'general', message: 'Failed to load users' }]);
      } else if (error.response?.status === 403) {
        // User doesn't have permission to view all users - this is expected for non-admin users
        console.log('User does not have admin permissions to view all users');
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : parseFloat(value)) :
                type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                type === 'radio' ? value :
                value
    }));

    // Clear field-specific error when user starts typing
    if (apiErrors[name]) {
      setApiErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const validation = validateReviewData(formData);
    
    if (!validation.isValid) {
      const fieldErrors: ValidationError[] = Object.entries(validation.errors).map(([field, messages]) => ({
        field,
        message: Array.isArray(messages) ? messages[0] : messages
      }));
      setErrors(fieldErrors);
      return false;
    }
    
    setErrors([]);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started');
    console.log('Current form data:', formData);
    
    // Clear previous messages
    setSuccessMessage('');
    setErrors([]);
    setApiErrors({});
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    console.log('Form validation passed');
    setLoading(true);

    try {
      const reviewData = {
        // Only send fields that exist in the API schema
        bid: formData.bid,
        review_type: formData.review_type,
        sequence: parseInt(String(formData.sequence || 1)) || 1,
        assigned_to: formData.assigned_to || null,
        reviewed_by: formData.reviewed_by || null,
        due_date: formData.due_date,
        score: formData.score ? parseInt(String(formData.score)) : null,
        strengths: formData.strengths || '',
        weaknesses: formData.weaknesses || '',
        recommendations: formData.recommendations || '',
        comments: formData.comments || '',
        sentiment_score: formData.sentiment_score ? String(formData.sentiment_score) : null,
        is_mandatory: Boolean(formData.is_mandatory),
        requires_signature: Boolean(formData.requires_signature)
      };

      console.log('Submitting review data:', reviewData);
      const response = await createBidReview(reviewData);
      console.log('Review created successfully:', response);
      
      // Show success message
      setSuccessMessage('Review created successfully!');
      
      // Reset form after successful creation
      setFormData({
        bid: '',
        review_type: '',
        sequence: 1,
        assigned_to: '',
        reviewed_by: '',
        due_date: '',
        status: 'pending',
        score: undefined,
        strengths: '',
        weaknesses: '',
        recommendations: '',
        comments: '',
        sentiment_score: undefined,
        is_mandatory: true,
        requires_signature: false
      });
      
      // Call success callback
      onSuccess?.(response);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Error creating review:', error);
      
      // Handle API validation errors
      if (error.response?.data) {
        console.log('API validation errors:', error.response.data);
        console.log('Full error response:', error.response);
        setApiErrors(error.response.data);
        
        // Convert API errors to ValidationError format for display
        const apiValidationErrors: ValidationError[] = Object.entries(error.response.data).map(([field, messages]) => ({
          field,
          message: Array.isArray(messages) ? messages[0] : messages as string
        }));
        setErrors(apiValidationErrors);
      } else {
        console.log('General error occurred:', error.message);
        setErrors([{ field: 'general', message: 'Failed to create review. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const reviewTypes = [
    { value: 'technical', label: 'Technical Review' },
    { value: 'commercial', label: 'Commercial Review' },
    { value: 'legal', label: 'Legal Review' },
    { value: 'financial', label: 'Financial Review' },
    { value: 'risk', label: 'Risk Assessment' },
    { value: 'final', label: 'Final Review' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create Bid Review</h2>
      
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800 font-medium">
            ✓ {successMessage}
          </div>
        </div>
      )}
      
      {/* General Error Display */}
      {errors.some(error => error.field === 'general') && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">
            {errors.filter(error => error.field === 'general').map((error, index) => (
              <div key={index}>{error.message}</div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bid Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bid *
            </label>
            <select
              name="bid"
              value={formData.bid}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.bid ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select a bid</option>
              {bids.map(bid => (
                <option key={bid.id} value={bid.id}>
                  {bid.code}: {bid.title}
                </option>
              ))}
            </select>
            {apiErrors.bid && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.bid[0]}</p>
            )}
          </div>

          {/* Review Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Type *
            </label>
            <select
              name="review_type"
              value={formData.review_type}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.review_type ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">Select review type</option>
              {reviewTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {apiErrors.review_type && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.review_type[0]}</p>
            )}
          </div>

          {/* Sequence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sequence
            </label>
            <input
              type="number"
              name="sequence"
              value={formData.sequence}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date *
            </label>
            <input
              type="datetime-local"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.due_date ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            />
            {apiErrors.due_date && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.due_date[0]}</p>
            )}
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            <select
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.assigned_to ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''} (${user.email})`
                    : user.email
                  }
                </option>
              ))}
            </select>
            {apiErrors.assigned_to && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.assigned_to[0]}</p>
            )}
          </div>

          {/* Reviewed By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reviewed By
            </label>
            <select
              name="reviewed_by"
              value={formData.reviewed_by}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.reviewed_by ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name || user.last_name 
                    ? `${user.first_name || ''} ${user.last_name || ''} (${user.email})`
                    : user.email
                  }
                </option>
              ))}
            </select>
            {apiErrors.reviewed_by && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.reviewed_by[0]}</p>
            )}
          </div>
        </div>

        {/* Review Content */}
        <div className="space-y-4">
          {/* Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score (0-100)
            </label>
            <input
              type="number"
              name="score"
              value={formData.score || ''}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.score ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter score between 0 and 100"
            />
            {apiErrors.score && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.score[0]}</p>
            )}
          </div>

          {/* Sentiment Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentiment Score
            </label>
            <input
              type="number"
              name="sentiment_score"
              value={formData.sentiment_score || ''}
              onChange={handleInputChange}
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                apiErrors.sentiment_score ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter sentiment score (decimal)"
            />
            {apiErrors.sentiment_score && (
              <p className="mt-1 text-sm text-red-600">{apiErrors.sentiment_score[0]}</p>
            )}
          </div>

          {/* Text Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strengths
              </label>
              <textarea
                name="strengths"
                value={formData.strengths}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter strengths..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weaknesses
              </label>
              <textarea
                name="weaknesses"
                value={formData.weaknesses}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter weaknesses..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendations
            </label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter recommendations..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter comments..."
            />
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_mandatory"
                checked={formData.is_mandatory}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Mandatory Review</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="requires_signature"
                checked={formData.requires_signature}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Requires Signature</span>
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BidReviewForm;
