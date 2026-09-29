import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail, Building, KeyRound, Save } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import FormInput from '../components/forms/FormInput';
import Avatar from '../components/common/Avatar';

// Schemas
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional()
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword']
  });

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || '',
      phone: user?.phone || ''
    }
  });

  // Password Form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const onUpdateProfile = async (data) => {
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('phone', data.phone || '');
      
      if (selectedFile) {
        formData.append('avatar', selectedFile);
      }

      const response = await api.patch('/auth/update-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.success) {
        setUser(response.data.data);
        setSelectedFile(null);
        toast.success('Profile details updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile details');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (data) => {
    setPasswordLoading(true);
    try {
      const response = await api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (response.data && response.data.success) {
        toast.success('Password updated successfully');
        resetPasswordForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* Profile Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="relative group">
          <Avatar
            src={selectedFile ? URL.createObjectURL(selectedFile) : user?.avatar}
            name={user?.name}
            size="xl"
          />
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-3xs font-bold rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition">
            Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="text-center md:text-left space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">{user?.name}</h2>
          <p className="text-sm text-slate-500 font-medium flex items-center justify-center md:justify-start gap-1.5">
            <Mail size={14} /> {user?.email}
          </p>
          <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-3xs font-bold uppercase tracking-wider">
              {user?.role}
            </span>
            {user?.department && (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-3xs font-bold flex items-center gap-1">
                <Building size={10} /> {user.department.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Update Details Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User size={18} className="text-blue-500" /> Account Details
          </h3>

          <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
            <FormInput
              label="Full Name"
              name="name"
              placeholder="NEC Admin"
              required
              error={profileErrors.name}
              {...registerProfile('name')}
            />

            <FormInput
              label="Phone Number"
              name="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              error={profileErrors.phone}
              {...registerProfile('phone')}
            />

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 gap-2 shadow-xs"
            >
              <Save size={16} /> Save Changes
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound size={18} className="text-blue-500" /> Update Security Credentials
          </h3>

          <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4">
            <FormInput
              label="Current Password"
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              required
              error={passwordErrors.currentPassword}
              {...registerPassword('currentPassword')}
            />

            <FormInput
              label="New Password"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              required
              error={passwordErrors.newPassword}
              {...registerPassword('newPassword')}
            />

            <FormInput
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              error={passwordErrors.confirmPassword}
              {...registerPassword('confirmPassword')}
            />

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 gap-2 shadow-xs"
            >
              <KeyRound size={16} /> Change Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
