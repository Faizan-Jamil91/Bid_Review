// src/hooks/useFormSubmit.ts
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

export function useFormSubmit<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  onSubmit: (data: T) => Promise<void>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(data as T);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    ...form,
    handleSubmit,
    isSubmitting,
    submitError,
  };
}