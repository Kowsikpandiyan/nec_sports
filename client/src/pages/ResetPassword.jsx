import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import FormInput from '../components/forms/FormInput';

// Validation Schema
const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post(`/auth/reset-password/${token}`, {
        password: data.password
      });

      if (response.data && response.data.success) {
        toast.success('Password updated successfully. Please login.');
        navigate('/login');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Password reset failed. Link may be expired.'
      );
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
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Create a strong new password for your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            label="New Password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            error={errors.password}
            {...register('password')}
          />

          <FormInput
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            error={errors.confirmPassword}
            {...register('confirmPassword')}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition shadow-sm flex items-center justify-center space-x-2 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Save Password</span>
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
      </div>
    </div>
  );
};

export default ResetPassword;
