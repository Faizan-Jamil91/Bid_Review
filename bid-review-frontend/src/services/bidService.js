import api from './api';

export const createBid = async (bidData) => {
  try {
    const response = await api.post('/bids/', bidData);
    return response.data;
  } catch (error) {
    console.error('Error creating bid:', error);
    throw error;
  }
};

export const getBids = async (params = {}) => {
  try {
    const response = await api.get('/bids/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching bids:', error);
    throw error;
  }
};

export const getBidById = async (id) => {
  try {
    const response = await api.get(`/bids/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bid:', error);
    throw error;
  }
};

export const updateBid = async (id, bidData) => {
  try {
    const response = await api.put(`/bids/${id}/`, bidData);
    return response.data;
  } catch (error) {
    console.error('Error updating bid:', error);
    throw error;
  }
};

export const deleteBid = async (id) => {
  try {
    await api.delete(`/bids/${id}/`);
  } catch (error) {
    console.error('Error deleting bid:', error);
    throw error;
  }
};

export const analyzeBidRequirements = async (bidId, bidData) => {
  try {
    const response = await api.post(`/bids/${bidId}/analyze-requirements/`, bidData);
    return response.data;
  } catch (error) {
    console.error('Error analyzing bid requirements:', error);
    throw error;
  }
};
