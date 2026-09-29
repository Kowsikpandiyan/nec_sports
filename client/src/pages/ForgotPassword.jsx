import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import FormInput from '../components/forms/FormInput';

// Validation Schema
const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address')
});

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.data && response.data.success) {
        toast.success('Password reset link sent successfully.');
        setSubmitted(true);
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to dispatch reset request. Check address.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-6 md:p-8 space-y-6">
        
        {/* Title */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600">
            <KeyRound size={26} />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Forgot Password
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Enter your registration email. We will send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium">
              📩 A password recovery link was dispatched. Check your inbox and spam folders.
            </div>
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 hover:underline font-semibold"
            >
              <ArrowLeft size={16} className="mr-1.5" /> Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              label="Email Address"
              name="email"
              placeholder="admin@nec.edu"
              required
              error={errors.email}
              {...register('email')}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition shadow-sm flex items-center justify-center space-x-2 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-xs text-slate-500 hover:text-slate-700 font-semibold"
              >
                <ArrowLeft size={12} className="mr-1.5" /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
