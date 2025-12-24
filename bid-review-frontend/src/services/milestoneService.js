import api from './api';

export const getMilestones = async (params = {}) => {
  try {
    const response = await api.get('/bids/milestones/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
};

export const getMilestoneById = async (id) => {
  try {
    const response = await api.get(`/bids/milestones/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching milestone:', error);
    throw error;
  }
};

export const createMilestone = async (milestoneData) => {
  try {
    const response = await api.post('/bids/milestones/', milestoneData);
    return response.data;
  } catch (error) {
    console.error('Error creating milestone:', error);
    throw error;
  }
};

export const updateMilestone = async (id, milestoneData) => {
  try {
    const response = await api.put(`/bids/milestones/${id}/`, milestoneData);
    return response.data;
  } catch (error) {
    console.error('Error updating milestone:', error);
    throw error;
  }
};

export const patchMilestone = async (id, milestoneData) => {
  try {
    const response = await api.patch(`/bids/milestones/${id}/`, milestoneData);
    return response.data;
  } catch (error) {
    console.error('Error patching milestone:', error);
    throw error;
  }
};

export const deleteMilestone = async (id) => {
  try {
    await api.delete(`/bids/milestones/${id}/`);
    return true;
  } catch (error) {
    console.error('Error deleting milestone:', error);
    throw error;
  }
};

export const getBidMilestones = async (bidId) => {
  try {
    const response = await api.get('/bids/milestones/', { params: { bid: bidId } });
    return response.data;
  } catch (error) {
    console.error('Error fetching bid milestones:', error);
    throw error;
  }
};

export const getMyMilestones = async () => {
  try {
    const response = await api.get('/bids/milestones/', { params: { assigned_to: 'me' } });
    return response.data;
  } catch (error) {
    console.error('Error fetching my milestones:', error);
    throw error;
  }
};

// Validation helpers
export const validateMilestoneData = (milestoneData) => {
  const errors = {};

  // Validate bid UUID
  if (!milestoneData.bid) {
    errors.bid = ['Bid is required'];
  }

  // Validate name
  if (!milestoneData.name || milestoneData.name.trim().length === 0) {
    errors.name = ['Milestone name is required'];
  } else if (milestoneData.name.length > 200) {
    errors.name = ['Milestone name cannot exceed 200 characters'];
  }

  // Validate due_date
  if (!milestoneData.due_date) {
    errors.due_date = ['Due date is required'];
  } else {
    const dueDate = new Date(milestoneData.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.due_date = ['Invalid due date format'];
    } else if (dueDate <= new Date()) {
      errors.due_date = ['Due date must be in the future'];
    }
  }

  // Validate status
  const validStatuses = ['pending', 'in_progress', 'completed', 'delayed', 'cancelled'];
  if (milestoneData.status && !validStatuses.includes(milestoneData.status)) {
    errors.status = ['Invalid status value'];
  }

  // Validate completed_date if provided
  if (milestoneData.completed_date) {
    const completedDate = new Date(milestoneData.completed_date);
    if (isNaN(completedDate.getTime())) {
      errors.completed_date = ['Invalid completed date format'];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const getMilestoneStatusBadge = (status) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    delayed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return statusStyles[status] || 'bg-gray-100 text-gray-800';
};

export const getMilestoneStatusIcon = (status) => {
  const statusIcons = {
    pending: 'fas fa-clock',
    in_progress: 'fas fa-spinner fa-spin',
    completed: 'fas fa-check-circle',
    delayed: 'fas fa-exclamation-triangle',
    cancelled: 'fas fa-times-circle'
  };
  return statusIcons[status] || 'fas fa-question-circle';
};

export const calculateMilestoneProgress = (milestones) => {
  if (!milestones || milestones.length === 0) return 0;
  
  const completed = milestones.filter(m => m.status === 'completed').length;
  return Math.round((completed / milestones.length) * 100);
};

export const getOverdueMilestones = (milestones) => {
  if (!milestones) return [];
  
  const now = new Date();
  return milestones.filter(milestone => {
    const dueDate = new Date(milestone.due_date);
    return dueDate < now && milestone.status !== 'completed' && milestone.status !== 'cancelled';
  });
};

export const getUpcomingMilestones = (milestones, days = 7) => {
  if (!milestones) return [];
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return milestones.filter(milestone => {
    const dueDate = new Date(milestone.due_date);
    return dueDate >= now && dueDate <= futureDate && milestone.status !== 'completed' && milestone.status !== 'cancelled';
  });
};
