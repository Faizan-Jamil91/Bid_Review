'use client';

import Link from 'next/link';
import { 
  ChartBarIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  const features = [
    {
      name: 'Smart Bid Management',
      description: 'Organize and track all your bids in one centralized platform with advanced filtering and search capabilities.',
      icon: DocumentTextIcon,
    },
    {
      name: 'AI-Powered Insights',
      description: 'Leverage machine learning to predict bid success rates and optimize your bidding strategy.',
      icon: SparklesIcon,
    },
    {
      name: 'Real-time Analytics',
      description: 'Get comprehensive analytics and reporting to make data-driven decisions for your business.',
      icon: ChartBarIcon,
    },
    {
      name: 'Team Collaboration',
      description: 'Work seamlessly with your team with role-based access control and workflow management.',
      icon: UserGroupIcon,
    },
    {
      name: 'Secure & Compliant',
      description: 'Enterprise-grade security with data encryption and compliance with industry standards.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Customer Management',
      description: 'Maintain detailed customer profiles and track all interactions in one place.',
      icon: UserGroupIcon,
    },
  ];

  const stats = [
    { label: 'Active Users', value: '10K+' },
    { label: 'Bids Managed', value: '50K+' },
    { label: 'Success Rate', value: '85%' },
    { label: 'Time Saved', value: '40%' },
  ];

  return (
    <div className="bg-white">
      {/* Navigation */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-primary-600">BidReview</span>
            </Link>
          </div>
          <div className="flex gap-x-6">
            <Link href="/auth/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600">
              Log in <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link
              href="/auth/register"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="relative isolate px-4 pt-8 lg:px-6">
        <div
          className="absolute inset-x-0 -top-20 -z-10 transform-gpu overflow-hidden blur-2xl sm:-top-40"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-200 to-primary-400 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="mx-auto max-w-4xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Streamline Your Bid Management Process
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg sm:mt-6">
              Manage bids, track opportunities, and win more business with our intelligent bid review system. 
              Powered by AI to help you make smarter decisions faster.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-4 sm:mt-10 sm:gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Get started for free
              </Link>
              <Link href="/dashboard" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600">
                View demo <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        <div
          className="absolute inset-x-0 top-[calc(100%-8rem)] -z-10 transform-gpu overflow-hidden blur-2xl sm:top-[calc(100%-15rem)]"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-primary-200 to-primary-400 opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-primary-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 text-center lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="mx-auto flex max-w-xs flex-col gap-y-2">
                <dt className="text-sm leading-6 text-gray-600">{stat.label}</dt>
                <dd className="order-first text-2xl font-semibold tracking-tight text-primary-600 sm:text-4xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 lg:px-6">
          <div className="mx-auto max-w-3xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Everything you need</h2>
            <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Powerful features for modern bid management
            </p>
            <p className="mt-4 text-base leading-7 text-gray-600 sm:text-lg sm:mt-6">
              Our comprehensive platform provides all the tools you need to manage bids efficiently, 
              collaborate with your team, and win more business.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                    {feature.name}
                  </dt>
                  <dd className="mt-3 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">{feature.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="px-4 py-16 sm:px-4 sm:py-20 lg:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Ready to transform your bid management?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-primary-100 sm:text-lg sm:mt-6">
              Join thousands of businesses already using BidReview to streamline their processes and win more bids.
            </p>
            <div className="mt-8 flex items-center justify-center gap-x-4 sm:mt-10 sm:gap-x-6">
              <Link
                href="/auth/register"
                className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started
              </Link>
              <Link href="/dashboard" className="text-sm font-semibold leading-6 text-white hover:text-primary-100">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-6xl px-4 py-8 md:flex md:items-center md:justify-between lg:px-6">
          <div className="flex justify-center space-x-6 md:order-2">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} BidReview. All rights reserved.
            </p>
          </div>
          <div className="mt-6 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-400">
              Professional Bid Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
