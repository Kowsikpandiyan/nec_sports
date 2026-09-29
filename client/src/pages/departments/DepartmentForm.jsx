import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Building2, Mail, Lock, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/axios';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import ImageUpload from '../../components/forms/ImageUpload';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const CredentialsCard = ({ credentials, onDone }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Department: ${credentials.department}\nCoordinator: ${credentials.name}\nEmail: ${credentials.email}\nPassword: ${credentials.rawPassword}\nRole: Coordinator`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #2756F5 0%, #1E40AF 100%)' }}>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="text-white" size={28} />
          </div>
          <h2 className="text-xl font-black text-white">Department Created!</h2>
          <p className="text-blue-100 text-sm mt-1">
            Coordinator login account is ready
          </p>
        </div>

        {/* Credentials */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 text-center">
            Share these login credentials with the coordinator. <strong>Save them now</strong> — the password won't be shown again.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-bold text-slate-800">{credentials.department}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Name</span>
              <span className="font-bold text-slate-800">{credentials.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Mail size={13} /> Email
              </span>
              <span className="font-bold text-blue-700">{credentials.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-3">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Lock size={13} /> Password
              </span>
              <span className="font-black text-green-700 bg-green-50 px-3 py-1 rounded-lg border border-green-200 font-mono">
                {credentials.rawPassword}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Role</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">
                Coordinator
              </span>
            </div>
          </div>

          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            ⚠️ The coordinator can change their password after logging in via their Profile page.
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-330 rounded-xl text-slate-700 hover:bg-slate-50 transition text-sm font-semibold"
            >
              <Copy size={15} />
              {copied ? 'Copied!' : 'Copy Credentials'}
            </button>
            <button
              onClick={onDone}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-sm transition shadow-sm"
              style={{ backgroundColor: '#2756F5' }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DepartmentForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  // Define dynamic schema inside the component based on isEdit state
  const dynamicSchema = z.object({
    name: z.string().min(3, 'Department name must be at least 3 characters'),
    college: z.string().min(1, 'Please select a college reference'),
    coordinatorName: z.string().min(2, 'Coordinator name is required'),
    coachName: z.string().optional(),
    description: z.string().optional(),
    coordinatorEmail: isEdit
      ? z.string().optional().or(z.literal(''))
      : z.string().email('Enter a valid email address').min(1, 'Email is required'),
    coordinatorPassword: isEdit
      ? z.string().optional().or(z.literal(''))
      : z.string().min(6, 'Password must be at least 6 characters')
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      name: '',
      college: '',
      coordinatorName: '',
      coachName: '',
      description: '',
      logo: null,
      coordinatorEmail: '',
      coordinatorPassword: ''
    }
  });

  const fetchCollegesAndData = async () => {
    try {
      const collegesRes = await api.get('/colleges?limit=100');
      if (collegesRes.data && collegesRes.data.data) {
        setColleges(collegesRes.data.data.map(c => ({ value: c._id, label: c.name })));
        
        if (collegesRes.data.data.length === 1 && !isEdit) {
          setValue('college', collegesRes.data.data[0]._id);
        }
      }

      if (isEdit) {
        const deptRes = await api.get(`/departments/${id}`);
        if (deptRes.data && deptRes.data.data) {
          const dept = deptRes.data.data;
          setValue('name', dept.name);
          setValue('college', dept.college?._id || dept.college);
          setValue('coordinatorName', dept.coordinatorName);
          setValue('coachName', dept.coachName || '');
          setValue('description', dept.description || '');
          setValue('logo', dept.logo || '');
        }
      }
    } catch (err) {
      toast.error('Failed to load form details');
    }
  };

  useEffect(() => {
    fetchCollegesAndData();
  }, [id]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('college', data.college);
      formData.append('coordinatorName', data.coordinatorName);
      formData.append('coachName', data.coachName || '');
      formData.append('description', data.description || '');
      
      if (data.logo instanceof File) {
        formData.append('logo', data.logo);
      }

      // Only send credentials when creating (not editing)
      if (!isEdit) {
        formData.append('coordinatorEmail', data.coordinatorEmail || '');
        formData.append('coordinatorPassword', data.coordinatorPassword || '');
      }

      let res;
      if (isEdit) {
        res = await api.put(`/departments/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Department updated successfully');
        navigate('/departments');
      } else {
        res = await api.post('/departments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (res.data && res.data.success) {
          // Show credentials modal instead of navigating away
          setCreatedCredentials({
            ...res.data.coordinatorAccount,
            rawPassword: data.coordinatorPassword
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit department form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">

      {/* Credentials success modal */}
      {createdCredentials && (
        <CredentialsCard
          credentials={createdCredentials}
          onDone={() => navigate('/departments')}
        />
      )}

      {/* Header */}
      <div>
        <Link
          to="/departments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1 mb-2"
        >
          <ArrowLeft size={14} /> Back to Departments
        </Link>
        <PageHeader
          title={isEdit ? 'Edit Department' : 'Add Department'}
          description={isEdit ? 'Modify department settings.' : 'Register a new department and set up coordinator login.'}
        />
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput
            label="Department Name"
            name="name"
            placeholder="e.g. Computer Science & Engineering"
            required
            error={errors.name}
            {...register('name')}
          />

          <FormSelect
            label="College Block"
            name="college"
            options={colleges}
            required
            error={errors.college}
            {...register('college')}
          />

          <FormInput
            label="Coordinator Name"
            name="coordinatorName"
            placeholder="Prof. Balaji"
            required
            error={errors.coordinatorName}
            {...register('coordinatorName')}
          />

          <FormInput
            label="Coach Name"
            name="coachName"
            placeholder="Coach Dinesh"
            error={errors.coachName}
            {...register('coachName')}
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs md:text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Provide a brief background on the department..."
              className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          <Controller
            control={control}
            name="logo"
            render={({ field }) => (
              <ImageUpload
                label="Department Logo"
                onChange={field.onChange}
                value={field.value}
                error={errors.logo}
              />
            )}
          />

          {/* Coordinator Login Credentials — only shown when creating */}
          {!isEdit && (
            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Lock size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Coordinator Login Account</p>
                  <p className="text-xs text-slate-500">These credentials will be used to log in to the portal</p>
                </div>
              </div>

              <FormInput
                label="Coordinator Email"
                name="coordinatorEmail"
                type="email"
                placeholder="coordinator@nec.edu"
                required
                error={errors.coordinatorEmail}
                {...register('coordinatorEmail')}
              />

              {/* Password field with show/hide toggle */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs md:text-sm font-semibold text-slate-700">
                  Coordinator Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    {...register('coordinatorPassword')}
                    className="w-full px-3 py-2 pr-10 text-sm rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.coordinatorPassword && (
                  <p className="text-xs text-red-500">{errors.coordinatorPassword.message}</p>
                )}
                <p className="text-xs text-slate-400">
                  The coordinator can change this password after logging in.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition gap-2 shadow-xs mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} /> {isEdit ? 'Save Changes' : 'Create Department & Account'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepartmentForm;
