'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CheckIcon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  bid_id?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

interface NotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'bid_assigned':
      return '📋';
    case 'bid_review':
      return '👁️';
    case 'bid_approved':
      return '✅';
    case 'bid_rejected':
      return '❌';
    case 'bid_due_soon':
      return '⏰';
    case 'bid_won':
      return '🎉';
    case 'bid_lost':
      return '😔';
    case 'deadline_reminder':
      return '📅';
    case 'system_update':
      return '🔔';
    default:
      return '📢';
  }
};

export default function NotificationList() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading, refetch } = useQuery<NotificationResponse>({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: '50',
        ...(filter === 'unread' && { unread_only: 'true' }),
      });
      const response = await axios.get(`/api/users/notifications/?${params}`);
      return response.data;
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationIds?: string[]) => {
      const response = await axios.post('/api/users/notifications/mark-read/', {
        notification_ids: notificationIds || [],
        mark_all: !notificationIds,
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
    onError: () => {
      toast.error('Failed to mark notifications as read');
    },
  });

  const handleMarkAsRead = (notificationIds?: string[]) => {
    markAsReadMutation.mutate(notificationIds);
  };

  const handleMarkAllAsRead = () => {
    markAsReadMutation.mutate(undefined);
  };

  const unreadNotifications = notifications?.results?.filter(n => !n.is_read) || [];
  const hasNotifications = notifications?.results && notifications.results.length > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellIcon className="h-6 w-6 text-gray-400" />
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            </div>
            {unreadNotifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                disabled={markAsReadMutation.isPending}
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="mt-4 flex space-x-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Notifications
              {notifications?.count && (
                <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                  {notifications.count}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Unread
              {unreadNotifications.length > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications list */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Loading notifications...</p>
            </div>
          ) : hasNotifications ? (
            notifications.results.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">
                      {getTypeIcon(notification.type)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                            notification.priority
                          )}`}
                        >
                          {notification.priority}
                        </span>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead([notification.id])}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Mark as read"
                            disabled={markAsReadMutation.isPending}
                          >
                            <CheckIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-gray-600">
                      {notification.message}
                    </p>
                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        {notification.type.replace('_', ' ')}
                      </span>
                      {notification.bid_id && (
                        <>
                          <span>•</span>
                          <a
                            href={`/dashboard/bids/${notification.bid_id}`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            View Bid
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <BellIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="mt-2 text-gray-500">
                {filter === 'unread'
                  ? 'You\'re all caught up!'
                  : 'You don\'t have any notifications yet.'}
              </p>
              {filter === 'unread' && (
                <button
                  onClick={() => setFilter('all')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all notifications
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {notifications?.next && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                // Load more notifications
                // This would need to be implemented with proper pagination
                toast('Load more functionality would be implemented here', {
                  icon: 'ℹ️',
                });
              }}
              className="w-full py-2 text-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Load more notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
