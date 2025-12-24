import api from './api';

export const createBidReview = async (reviewData) => {
  try {
    const response = await api.post('/bids/reviews/', reviewData);
    return response.data;
  } catch (error) {
    console.error('Error creating bid review:', error);
    throw error;
  }
};

export const getBidReviews = async (params = {}) => {
  try {
    const response = await api.get('/bids/reviews/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bid reviews:', error);
    throw error;
  }
};

export const getReviewById = async (id) => {
  try {
    const response = await api.get(`/bids/reviews/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching review:', error);
    throw error;
  }
};

export const updateReview = async (id, reviewData) => {
  try {
    const response = await api.put(`/bids/reviews/${id}/`, reviewData);
    return response.data;
  } catch (error) {
    console.error('Error updating review:', error);
    throw error;
  }
};

export const completeReview = async (id, decision, comments, score) => {
  try {
    const response = await api.post(`/bids/reviews/${id}/complete/`, {
      decision,
      comments,
      score
    });
    return response.data;
  } catch (error) {
    console.error('Error completing review:', error);
    throw error;
  }
};

export const deleteReview = async (id) => {
  try {
    await api.delete(`/bids/reviews/${id}/`);
  } catch (error) {
    console.error('Error deleting review:', error);
    throw error;
  }
};

// Validation helpers
export const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateDecimal = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
};

export const validateReviewData = (reviewData) => {
  const errors = {};

  // Validate bid UUID
  if (!reviewData.bid) {
    errors.bid = ['Bid is required'];
  } else if (!validateUUID(reviewData.bid)) {
    errors.bid = ['Invalid bid UUID format'];
  }

  // Validate review type
  if (!reviewData.review_type) {
    errors.review_type = ['Review type is required'];
  }

  // Validate assigned_to UUID if provided
  if (reviewData.assigned_to && !validateUUID(reviewData.assigned_to)) {
    errors.assigned_to = ['Invalid assigned user UUID format'];
  }

  // Validate reviewed_by UUID if provided
  if (reviewData.reviewed_by && !validateUUID(reviewData.reviewed_by)) {
    errors.reviewed_by = ['Invalid reviewer UUID format'];
  }

  // Validate due_date
  if (!reviewData.due_date) {
    errors.due_date = ['Due date is required'];
  } else {
    const dueDate = new Date(reviewData.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.due_date = ['Invalid due date format'];
    }
    // Remove the future-only requirement to allow more flexibility
    // else if (dueDate <= new Date()) {
    //   errors.due_date = ['Due date must be in the future'];
    // }
  }

  // Validate score if provided
  if (reviewData.score !== undefined && reviewData.score !== null) {
    const score = parseFloat(reviewData.score);
    if (isNaN(score) || score < 0 || score > 100) {
      errors.score = ['Score must be between 0 and 100'];
    }
  }

  // Validate sentiment_score if provided
  if (reviewData.sentiment_score !== undefined && reviewData.sentiment_score !== null) {
    if (!validateDecimal(reviewData.sentiment_score)) {
      errors.sentiment_score = ['Sentiment score must be a valid decimal number'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
