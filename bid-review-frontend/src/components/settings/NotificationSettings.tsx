'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface NotificationPreferences {
  professional_bid_notifications: boolean;
  professional_review_notifications: boolean;
  professional_deadline_notifications: boolean;
  enabled_notifications: string[];
  email_notifications: boolean;
  in_app_notifications: boolean;
  professional_email_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  professional_priority_threshold: 'all' | 'high' | 'critical';
}

const notificationTypes = [
  { value: 'bid_assigned', label: 'Bid Assigned', description: 'When a new bid is assigned to you' },
  { value: 'bid_review', label: 'Bid Review Required', description: 'When a bid needs your review' },
  { value: 'bid_approved', label: 'Bid Approved', description: 'When a bid is approved' },
  { value: 'bid_rejected', label: 'Bid Rejected', description: 'When a bid is rejected' },
  { value: 'bid_due_soon', label: 'Bid Due Soon', description: 'When a bid deadline is approaching' },
  { value: 'bid_won', label: 'Bid Won', description: 'When a bid is won' },
  { value: 'bid_lost', label: 'Bid Lost', description: 'When a bid is lost' },
  { value: 'deadline_reminder', label: 'Deadline Reminder', description: 'General deadline reminders' },
  { value: 'system_update', label: 'System Update', description: 'Important system notifications' },
];

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notification preferences
  const { data: preferences, isLoading } = useQuery<NotificationPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await axios.get('/api/users/notification-preferences/');
      return response.data;
    },
  });

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      const response = await axios.patch('/api/users/notification-preferences/', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Notification preferences updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => {
      toast.error('Failed to update notification preferences');
    },
  });

  const { register, handleSubmit, watch, reset } = useForm<NotificationPreferences>({
    defaultValues: preferences,
  });

  // Reset form when preferences are loaded
  if (preferences && !watch('enabled_notifications')?.length) {
    reset(preferences);
  }

  const onSubmit = async (data: NotificationPreferences) => {
    setIsSaving(true);
    try {
      await updatePreferencesMutation.mutateAsync(data);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationTypeToggle = (type: string) => {
    const currentTypes = watch('enabled_notifications') || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    return newTypes;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Email and In-App Notifications */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Notification Channels
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose how you want to receive notifications
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                {...register('email_notifications')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  In-App Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications in the application
                </p>
              </div>
              <input
                type="checkbox"
                {...register('in_app_notifications')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Professional Settings */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Professional Settings
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure professional notification preferences
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Professional Bid Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications for professional bid activities
                </p>
              </div>
              <input
                type="checkbox"
                {...register('professional_bid_notifications')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Professional Review Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications for professional review requests
                </p>
              </div>
              <input
                type="checkbox"
                {...register('professional_review_notifications')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  Professional Deadline Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive professional deadline reminders
                </p>
              </div>
              <input
                type="checkbox"
                {...register('professional_deadline_notifications')}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Email Frequency
                </label>
                <select
                  {...register('professional_email_frequency')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="immediate">Immediate</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Priority Threshold
                </label>
                <select
                  {...register('professional_priority_threshold')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Notifications</option>
                  <option value="high">High Priority Only</option>
                  <option value="critical">Critical Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Notification Types
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose which types of notifications you want to receive
          </p>
          
          <div className="mt-6 space-y-3">
            {notificationTypes.map((type) => (
              <div key={type.value} className="flex items-start">
                <input
                  type="checkbox"
                  value={type.value}
                  {...register('enabled_notifications')}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="ml-3">
                  <label className="text-sm font-medium text-gray-900">
                    {type.label}
                  </label>
                  <p className="text-sm text-gray-500">
                    {type.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || updatePreferencesMutation.isPending}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSaving || updatePreferencesMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
