'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { LockClosedIcon, EnvelopeIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

/**
 * Validation schema for the login form using Yup.
 * Validates that:
 * - Email is a valid email format and is required
 * - Password is required
 */
const loginSchema = yup.object().shape({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});

/**
 * LoginPage Component
 * 
 * Handles user authentication by validating credentials and managing the login state.
 * Provides a form for users to enter their email and password, with validation feedback.
 * 
 * @component
 * @returns {JSX.Element} The rendered login page with form and navigation links
 */
export default function LoginPage() {
  // Router instance for navigation
  const router = useRouter();
  
  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Form handling with react-hook-form and yup validation
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
  });

  /**
   * Handles form submission for user login
   * @async
   * @param {Object} data - The form data containing user credentials
   * @param {string} data.email - User's email address
   * @param {string} data.password - User's password
   * @returns {Promise<void>}
   * @throws {Error} If authentication fails
   */
  const { login } = useAuth();

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      
      // Get redirect URL from query parameters
      await login(data.email, data.password);
      
      // Handle redirect after successful login
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
      }
      toast.success('Login successful!');
    } catch (error) {
      console.error(error);
      const msg = (error as any)?.response?.data || 'Invalid credentials. Please try again.';
      toast.error(typeof msg === 'string' ? msg : (msg.detail || 'Invalid credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left side - Branding/Illustration */}
      <div className="w-full md:w-1/2 lg:w-3/5 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 md:p-12 lg:p-20 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg mx-auto text-center text-white relative z-10"
        >
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white border-opacity-30">
              <LockClosedIcon className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">Welcome Back</h1>
          <p className="text-blue-50 text-lg md:text-xl mb-12 leading-relaxed">Sign in to access your dashboard and manage your bids with powerful insights.</p>
          
          <div className="mt-16 hidden md:block">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">10K+</div>
                <div className="text-blue-200 text-sm">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">50K+</div>
                <div className="text-blue-200 text-sm">Bids Managed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">85%</div>
                <div className="text-blue-200 text-sm">Success Rate</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex items-center justify-center p-8 md:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 md:p-12 border border-gray-100"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-base text-gray-600">Enter your credentials to access your account</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full pl-10 pr-3 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-sm bg-gray-50 focus:bg-white"
                  placeholder="admin@admin.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-150"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full pl-10 pr-3 py-3.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out text-sm bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <ArrowRightOnRectangleIcon className="h-5 w-5 text-blue-200 group-hover:text-blue-100 transition-colors duration-150" />
                )}
              </span>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link 
                href="/auth/register" 
                className="w-full flex items-center justify-center px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
              >
                Create new account
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}