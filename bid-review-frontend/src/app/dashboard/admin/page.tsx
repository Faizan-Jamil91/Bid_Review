import { ShieldCheckIcon, UserGroupIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'User Management',
    description: 'Manage user accounts, roles, and permissions',
    icon: UserGroupIcon,
    href: '/dashboard/admin/users',
  },
  {
    name: 'System Settings',
    description: 'Configure system-wide settings and preferences',
    icon: CogIcon,
    href: '/dashboard/admin/settings',
  },
  {
    name: 'Analytics',
    description: 'View system usage and performance metrics',
    icon: ChartBarIcon,
    href: '/dashboard/admin/analytics',
  },
  {
    name: 'Audit Logs',
    description: 'Review system activity and changes',
    icon: ShieldCheckIcon,
    href: '/dashboard/admin/audit-logs',
  },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your bid review system settings and users.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <a
                key={feature.name}
                href={feature.href}
                className="group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    <span className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      {feature.name}
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {feature.description}
                  </p>
                </div>
                <span
                  className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-primary-400"
                  aria-hidden="true"
                >
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414L3.293 19.293zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
                  </svg>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            System Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Overview of your bid review system.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">System Version</dt>
              <dd className="mt-1 text-sm text-gray-900">v1.0.0</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">June 15, 2023</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Users</dt>
              <dd className="mt-1 text-sm text-gray-900">24</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Bids</dt>
              <dd className="mt-1 text-sm text-gray-900">156</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}