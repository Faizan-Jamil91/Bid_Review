import React, { useState, useEffect } from 'react';
import { createMilestone, updateMilestone, validateMilestoneData } from '../../services/milestoneService';
import { getBids } from '../../services/bidService';
import { getUsers } from '../../services/userService';

interface MilestoneFormProps {
  onSuccess?: (milestone: any) => void;
  onCancel?: () => void;
  initialData?: Partial<any>;
  bidId?: string; // Pre-fill bid if provided
}

const MilestoneForm: React.FC<MilestoneFormProps> = ({ 
  onSuccess, 
  onCancel, 
  initialData = {},
  bidId
}) => {
  const [formData, setFormData] = useState({
    bid: bidId || '',
    name: '',
    description: '',
    due_date: '',
    completed_date: '',
    status: 'pending',
    assigned_to: '',
    ...initialData
  });

  const [bids, setBids] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bidsResponse, usersResponse] = await Promise.all([
          getBids(),
          getUsers()
        ]);
        setBids(bidsResponse.results || bidsResponse);
        setUsers(usersResponse.results || usersResponse);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const validateForm = () => {
    const validation = validateMilestoneData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors as unknown as Record<string, string[]>);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrors({});
    setApiErrors({});

    try {
      const milestoneData = {
        ...formData,
        // Convert empty strings to null for optional fields
        assigned_to: formData.assigned_to || null,
        completed_date: formData.completed_date || null,
        description: formData.description || ''
      };

      let response;
      if (initialData.id) {
        response = await updateMilestone(initialData.id, milestoneData);
      } else {
        response = await createMilestone(milestoneData);
      }

      setSuccessMessage(`Milestone ${initialData.id ? 'updated' : 'created'} successfully!`);
      
      // Reset form if creating new milestone
      if (!initialData.id) {
        setFormData({
          bid: bidId || '',
          name: '',
          description: '',
          due_date: '',
          completed_date: '',
          status: 'pending',
          assigned_to: ''
        });
      }

      onSuccess?.(response);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Error saving milestone:', error);
      
      if (error.response?.data) {
        setApiErrors(error.response.data);
        const apiValidationErrors: Record<string, string[]> = error.response.data;
        setErrors(apiValidationErrors);
      } else {
        setErrors({ general: ['Failed to save milestone. Please try again.'] });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: []
      }));
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">
        {initialData.id ? 'Edit Milestone' : 'Create New Milestone'}
      </h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              errors.bid ? 'border-red-500' : 'border-gray-300'
            }`}
            required
            disabled={!!bidId} // Disable if bidId is pre-filled
          >
            <option value="">Select a bid...</option>
            {bids.map((bid: any) => (
              <option key={bid.id} value={bid.id}>
                {bid.code}: {bid.title}
              </option>
            ))}
          </select>
          {errors.bid && (
            <p className="mt-1 text-sm text-red-600">{errors.bid[0]}</p>
          )}
        </div>

        {/* Milestone Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Milestone Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter milestone name"
            maxLength={200}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name[0]}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter milestone description (optional)"
            rows={3}
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
            value={formatDateForInput(formData.due_date)}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.due_date ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.due_date && (
            <p className="mt-1 text-sm text-red-600">{errors.due_date[0]}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Completed Date (only show if status is completed) */}
        {formData.status === 'completed' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Completed Date
            </label>
            <input
              type="datetime-local"
              name="completed_date"
              value={formatDateForInput(formData.completed_date)}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.completed_date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.completed_date && (
              <p className="mt-1 text-sm text-red-600">{errors.completed_date[0]}</p>
            )}
          </div>
        )}

        {/* Assigned To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Assigned To
          </label>
          <select
            name="assigned_to"
            value={formData.assigned_to}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Unassigned</option>
            {users.map((user: any) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (initialData.id ? 'Update' : 'Create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MilestoneForm;
