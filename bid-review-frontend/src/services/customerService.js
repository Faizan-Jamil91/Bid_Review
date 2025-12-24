import api from './api';

export const createCustomer = async (customerData) => {
  try {
    // Ensure required fields are present and properly formatted
    const formattedData = {
      name: customerData.name?.trim(),
      customer_type: customerData.customer_type || 'corporate',
      email: customerData.email?.trim() || '',
      phone: customerData.phone?.trim() || '',
      address: customerData.address?.trim() || '',
      website: customerData.website?.trim() || '',
      industry: customerData.industry?.trim() || '',
      annual_revenue: customerData.annual_revenue ? Number(customerData.annual_revenue) : null,
      credit_rating: customerData.credit_rating?.trim() || '',
      relationship_score: customerData.relationship_score ? Number(customerData.relationship_score) : 50,
      tags: Array.isArray(customerData.tags) ? customerData.tags : 
           (typeof customerData.tags === 'string' ? customerData.tags.split(',').map(tag => tag.trim()) : []),
      is_active: customerData.is_active !== false
    };

    const response = await api.post('/bids/customers/', formattedData);
    return response.data;
  } catch (error) {
    console.error('Error creating customer:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // Throw a more descriptive error
      const errorMessage = error.response.data?.detail || 
                         (typeof error.response.data === 'object' ? 
                          JSON.stringify(error.response.data) : 
                          error.response.data || 'Failed to create customer');
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      throw new Error('No response received from server. Please check your connection.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      throw error;
    }
  }
};

export const getCustomers = async (params = {}) => {
  try {
    const response = await api.get('/bids/customers/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

export const getCustomerById = async (id) => {
  try {
    const response = await api.get(`/bids/customers/${id}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching customer:', error);
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const response = await api.put(`/bids/customers/${id}/`, customerData);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    await api.delete(`/bids/customers/${id}/`);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};
