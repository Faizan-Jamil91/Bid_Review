// src/utils/errorHandler.ts
import { AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

export function handleApiError(error: unknown, defaultMessage = 'An error occurred') {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message || error.message || defaultMessage;
    
    // Show error toast
    toast.error(message);
    
    // Return the error message for form handling
    return new Error(message);
  }
  
  const message = error instanceof Error ? error.message : defaultMessage;
  toast.error(message);
  return new Error(message);
}