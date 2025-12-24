import api from '../services/api';

export const testApiConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.get('/bids/');
    console.log('API Test Response:', response);
    return response.data;
  } catch (error) {
    console.error('API Test Error:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    throw error;
  }
};
