'use client';

import { Fragment, useEffect, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', current: true },
  { name: 'Bids', href: '/dashboard/bids', current: false },
  { name: 'Reviews', href: '/dashboard/reviews', current: false },
  { name: 'Milestones', href: '/dashboard/milestones', current: false },
  { name: 'Customers', href: '/dashboard/customers', current: false },
  { name: 'Analytics', href: '/dashboard/analytics', current: false },
  { name: 'Settings', href: '/dashboard/settings', current: false },
  { name: 'Admin', href: '/dashboard/admin', current: false },
];

export default function Navigation() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Only show navigation when mounted (client-side)
  if (!mounted) {
    return null;
  }

  return (
    <Disclosure as="nav" className="bg-white border-b border-gray-200 shadow-sm">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <Link href="/dashboard" className="flex items-center space-x-2 group">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
                      <span className="text-white font-bold text-lg">B</span>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      BidReview
                    </span>
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-1 sm:overflow-x-auto">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'bg-blue-50 text-blue-700 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent',
                        'inline-flex items-center px-3 py-2 border-b-2 text-sm font-semibold transition-all duration-200 rounded-t-lg whitespace-nowrap'
                      )}
                      aria-current={pathname === item.href ? 'page' : undefined}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
                <NotificationDropdown />

                {/* Profile dropdown */}
                <Menu as="div" className="relative">
                  <div>
                    <Menu.Button className="flex items-center space-x-3 bg-gray-50 rounded-xl px-3 py-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md">
                        U
                      </div>
                      <span className="sr-only">Open user menu</span>
                    </Menu.Button>
                  </div>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-xl py-2 bg-white border border-gray-200 focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/dashboard/profile"
                            className={classNames(
                              active ? 'bg-blue-50 text-blue-700' : 'text-gray-700',
                              'block px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-colors duration-150'
                            )}
                          >
                            Your Profile
                          </Link>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="#"
                            className={classNames(
                              active ? 'bg-blue-50 text-blue-700' : 'text-gray-700',
                              'block px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-colors duration-150'
                            )}
                          >
                            Settings
                          </Link>
                        )}
                      </Menu.Item>
                      <div className="border-t border-gray-200 my-2"></div>
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/auth/login"
                            className={classNames(
                              active ? 'bg-red-50 text-red-700' : 'text-red-600',
                              'block px-4 py-2.5 text-sm font-medium rounded-lg mx-2 transition-colors duration-150'
                            )}
                          >
                            Sign out
                          </Link>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors duration-200">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                    'block pl-3 pr-4 py-2 border-l-4 text-base font-medium'
                  )}
                  aria-current={pathname === item.href ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
                    U
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">User</div>
                  <div className="text-sm font-medium text-gray-500">user@example.com</div>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <NotificationDropdown />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Disclosure.Button
                  as={Link}
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Your Profile
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  href="/dashboard/settings"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Settings
                </Disclosure.Button>
                <Disclosure.Button
                  as={Link}
                  href="/auth/login"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </Disclosure.Button>
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}