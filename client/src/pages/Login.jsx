import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, Eye, EyeOff, ShieldCheck, Users, BarChart2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// Validation Schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Login = () => {
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);
    if (result && result.success) {
      navigate('/dashboard');
    }
  };

  const features = [
    { icon: Trophy, text: 'Manage tournaments & brackets' },
    { icon: Users, text: 'Register teams & players' },
    { icon: BarChart2, text: 'Track live scores & standings' },
    { icon: ShieldCheck, text: 'Role-based access control' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left panel — blue brand strip */}
      <div
        className="hidden lg:flex flex-col justify-center items-start px-12 w-5/12 text-white"
        style={{ background: 'linear-gradient(135deg, #2756F5 0%, #1E40AF 100%)' }}
      >
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center">
              <Trophy size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide uppercase">NEC Sports</h1>
              <p className="text-xs text-white/70 font-medium">College of Engineering</p>
            </div>
          </div>
          <h2 className="text-3xl font-black leading-tight mb-4">
            Tournament Management System
          </h2>
          <p className="text-white/80 text-sm leading-relaxed">
            Manage college sports tournaments, live scores, team rosters, and department standings — all in one place.
          </p>
        </div>

        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <f.icon size={16} className="text-white" />
              </div>
              <span className="text-sm text-white/90 font-medium">{f.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 pt-8 border-t border-white/20 w-full">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} NEC College of Engineering. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right panel — white form */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center space-x-3 mb-8 lg:hidden">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#2756F5' }}
            >
              <Trophy size={22} className="text-white" />
            </div>
            <div>
              <p className="text-base font-extrabold text-gray-900 tracking-wide uppercase">NEC Sports</p>
              <p className="text-xs text-gray-500">Tournament Management System</p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="e.g. admin@nec.edu"
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg bg-white border transition outline-none ${
                  errors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                } text-gray-800 placeholder-gray-400`}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="text-sm font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-lg bg-white border transition outline-none pr-10 ${
                    errors.password
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/30'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  } text-gray-800`}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-bold rounded-lg text-white transition disabled:opacity-60 flex items-center justify-center space-x-2 mt-2"
              style={{ backgroundColor: '#2756F5' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#1E40AF'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#2756F5'; }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
            >
              ← Back to Public Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
