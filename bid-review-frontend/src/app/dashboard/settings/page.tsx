'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { UserCircleIcon, BellIcon, CogIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  title: string;
  department: string;
  phone_number: string;
  role: string;
  business_unit: string;
  is_professional: boolean;
  professional_title: string;
  professional_bio: string;
  date_joined: string;
  last_login: string;
}

const tabs = [
  { name: 'Profile', icon: UserCircleIcon, current: true },
  { name: 'Notifications', icon: BellIcon, current: false },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Profile');

  // Fetch user data
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await axios.get('/api/users/profile/');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const isActive = tab.name === activeTab;
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon
                      className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                        isActive ? 'text-blue-500' : 'text-gray-400'
                      }`}
                      aria-hidden="true"
                    />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="mt-8 lg:mt-0 lg:col-span-9">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6 border-b border-gray-200">
                <div className="flex items-center">
                  {activeTab === 'Profile' && (
                    <UserCircleIcon className="h-6 w-6 text-gray-400 mr-3" />
                  )}
                  {activeTab === 'Notifications' && (
                    <BellIcon className="h-6 w-6 text-gray-400 mr-3" />
                  )}
                  <h2 className="text-lg font-medium text-gray-900">
                    {activeTab}
                  </h2>
                </div>
              </div>

              <div className="px-4 py-5 sm:p-6">
                {activeTab === 'Profile' && user && (
                  <ProfileSettings user={user} />
                )}
                {activeTab === 'Notifications' && (
                  <NotificationSettings />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings({ user }: { user: User }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    title: user.title,
    department: user.department,
    phone_number: user.phone_number,
    professional_title: user.professional_title,
    professional_bio: user.professional_bio,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // TODO: Replace with actual API call
      // await axios.patch('/api/users/profile/', formData);
      
      setIsEditing(false);
      // Show success message
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      title: user.title,
      department: user.department,
      phone_number: user.phone_number,
      professional_title: user.professional_title,
      professional_bio: user.professional_bio,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                isEditing
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                isEditing
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Job Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                isEditing
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                isEditing
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                isEditing
                  ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  : 'border-transparent bg-gray-50'
              }`}
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      {user.is_professional && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Professional Title
              </label>
              <input
                type="text"
                name="professional_title"
                value={formData.professional_title}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  isEditing
                    ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-transparent bg-gray-50'
                }`}
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">
                Professional Bio
              </label>
              <textarea
                name="professional_bio"
                value={formData.professional_bio}
                onChange={handleInputChange}
                disabled={!isEditing}
                rows={4}
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                  isEditing
                    ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-transparent bg-gray-50'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Role</dt>
            <dd className="mt-1 text-sm text-gray-900 capitalize">{user.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Business Unit</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.business_unit}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Member Since</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(user.date_joined).toLocaleDateString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Last Login</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
            </dd>
          </div>
        </dl>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit Profile
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </>
        )}
      </div>
    </div>
  );
}
