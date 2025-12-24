'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { toast } from 'react-hot-toast';

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
      return 'bg-red-500';
    case 'high':
      return 'bg-orange-500';
    case 'medium':
      return 'bg-blue-500';
    case 'low':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axios.get('/api/users/notifications/?limit=10');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery<{ unread_count: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await axios.get('/api/users/notifications/unread-count/');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadNotifications = notifications?.results?.filter(n => !n.is_read) || [];
  const hasNotifications = notifications?.results && notifications.results.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Menu as="div" className="relative">
        <div>
          <Menu.Button
            className="relative bg-gray-50 p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" aria-hidden="true" />
            {unreadCount && unreadCount.unread_count > 0 && (
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </Menu.Button>
        </div>

        <Transition
          show={isOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-96 rounded-xl shadow-xl bg-white border border-gray-200 focus:outline-none max-h-96 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadNotifications.length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    disabled={markAsReadMutation.isPending}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              {unreadCount && unreadCount.unread_count > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {unreadCount.unread_count} unread notification{unreadCount.unread_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : hasNotifications ? (
                <div className="divide-y divide-gray-100">
                  {notifications.results.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            active ? 'bg-gray-50' : ''
                          } ${!notification.is_read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <span className="text-xl">
                                {getTypeIcon(notification.type)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span
                                    className={`inline-block w-2 h-2 rounded-full ${getPriorityColor(
                                      notification.priority
                                    )}`}
                                    title={`${notification.priority} priority`}
                                  />
                                  {!notification.is_read && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMarkAsRead([notification.id]);
                                      }}
                                      className="text-gray-400 hover:text-gray-600"
                                      title="Mark as read"
                                    >
                                      <CheckIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDistanceToNow(new Date(notification.created_at), {
                                  addSuffix: true,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>

            {hasNotifications && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => {
                    // Navigate to full notifications page
                    window.location.href = '/dashboard/notifications';
                  }}
                >
                  View all notifications
                </button>
              </div>
            )}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
