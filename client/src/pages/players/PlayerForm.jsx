import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Users } from 'lucide-react';
import api from '../../lib/axios';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import ImageUpload from '../../components/forms/ImageUpload';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

// Validation Schema
const playerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  rollNumber: z.string().min(2, 'Roll number is required'),
  department: z.string().min(1, 'Please select a department'),
  college: z.string().min(1, 'Please select a college'),
  age: z.coerce.number().min(15, 'Age must be at least 15').max(50, 'Age must be reasonable'),
  jerseyNumber: z.coerce.number().min(1, 'Jersey number must be at least 1'),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email address').or(z.literal('')),
  position: z.string().optional(),
  sports: z.array(z.string()).min(1, 'Select at least one sport enrollment')
});

const PlayerForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sportsList, setSportsList] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: '',
      rollNumber: '',
      department: '',
      college: '',
      age: 18,
      jerseyNumber: 1,
      phone: '',
      email: '',
      position: '',
      sports: [],
      photo: null
    }
  });

  const selectedCollege = watch('college');

  const fetchMetadata = async () => {
    try {
      const [collegesRes, sportsRes] = await Promise.all([
        api.get('/colleges?limit=100'),
        api.get('/sports?limit=100')
      ]);

      if (collegesRes.data?.data) {
        setColleges(collegesRes.data.data.map(c => ({ value: c._id, label: c.name })));
        if (collegesRes.data.data.length === 1 && !isEdit) {
          setValue('college', collegesRes.data.data[0]._id);
        }
      }

      if (sportsRes.data?.data) {
        setSportsList(sportsRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load colleges or sports lists');
    }
  };

  const fetchDepartmentsByCollege = async (collegeId) => {
    try {
      const deptsRes = await api.get(`/departments?college=${collegeId}&limit=100`);
      if (deptsRes.data?.data) {
        setDepartments(deptsRes.data.data.map(d => ({ value: d._id, label: d.name })));
      }
    } catch (err) {
      console.error('Failed to fetch departments');
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      fetchDepartmentsByCollege(selectedCollege);
    } else {
      setDepartments([]);
    }
  }, [selectedCollege]);

  const loadPlayerData = async () => {
    if (!isEdit) return;
    try {
      const res = await api.get(`/players/${id}`);
      if (res.data && res.data.data) {
        const { player } = res.data.data;
        
        setValue('name', player.name);
        setValue('rollNumber', player.rollNumber);
        setValue('college', player.college?._id || player.college);
        
        // Wait briefly for departments list to fetch based on college ID
        await fetchDepartmentsByCollege(player.college?._id || player.college);
        setValue('department', player.department?._id || player.department);
        
        setValue('age', player.age);
        setValue('jerseyNumber', player.jerseyNumber);
        setValue('phone', player.phone || '');
        setValue('email', player.email || '');
        setValue('position', player.position || '');
        setValue('sports', player.sports?.map(s => s._id || s) || []);
        setValue('photo', player.photo || '');
      }
    } catch (err) {
      toast.error('Failed to load player details');
    }
  };

  useEffect(() => {
    if (colleges.length > 0) {
      loadPlayerData();
    }
  }, [id, colleges]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('rollNumber', data.rollNumber);
      formData.append('college', data.college);
      formData.append('department', data.department);
      formData.append('age', data.age);
      formData.append('jerseyNumber', data.jerseyNumber);
      formData.append('phone', data.phone || '');
      formData.append('email', data.email || '');
      formData.append('position', data.position || '');
      formData.append('sports', JSON.stringify(data.sports));

      if (data.photo instanceof File) {
        formData.append('photo', data.photo);
      }

      let res;
      if (isEdit) {
        res = await api.put(`/players/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/players', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data && res.data.success) {
        toast.success(isEdit ? 'Player profile updated' : 'Player registered successfully');
        navigate('/players');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit player details');
    } finally {
      setLoading(false);
    }
  };

  const handleSportToggle = (sportId, field) => {
    const currentList = [...field.value];
    const index = currentList.indexOf(sportId);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(sportId);
    }
    field.onChange(currentList);
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/players"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1 mb-2"
        >
          <ArrowLeft size={14} /> Back to Athletes Roster
        </Link>
        <PageHeader
          title={isEdit ? 'Edit Athlete Profile' : 'Register Athlete'}
          description={isEdit ? 'Modify student player details.' : 'Register a student as an active college athlete.'}
        />
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput
            label="Athlete Name"
            name="name"
            placeholder="e.g. Anand Kumar"
            required
            error={errors.name}
            {...register('name')}
          />

          <FormInput
            label="Roll Number / Register Number"
            name="rollNumber"
            placeholder="e.g. CSE2104"
            required
            error={errors.rollNumber}
            {...register('rollNumber')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="College Block"
              name="college"
              options={colleges}
              required
              error={errors.college}
              {...register('college')}
            />

            <FormSelect
              label="Department Roster"
              name="department"
              options={departments}
              required
              disabled={!selectedCollege}
              placeholder={!selectedCollege ? 'Select a college first' : 'Select department'}
              error={errors.department}
              {...register('department')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Age"
              name="age"
              type="number"
              required
              error={errors.age}
              {...register('age')}
            />

            <FormInput
              label="Jersey Number"
              name="jerseyNumber"
              type="number"
              required
              error={errors.jerseyNumber}
              {...register('jerseyNumber')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Contact Phone"
              name="phone"
              type="tel"
              placeholder="e.g. 9887766554"
              error={errors.phone}
              {...register('phone')}
            />

            <FormInput
              label="Email Address"
              name="email"
              placeholder="student@nec.edu"
              error={errors.email}
              {...register('email')}
            />
          </div>

          <FormInput
            label="Position / Role"
            name="position"
            placeholder="Forward / Wicketkeeper / Defender"
            error={errors.position}
            {...register('position')}
          />

          {/* Sports Selection Checkboxes */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-xs md:text-sm font-semibold text-slate-700">
              Sports Enrollment <span className="text-red-500">*</span>
            </span>

            <Controller
              control={control}
              name="sports"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {sportsList.map((sport) => {
                    const isChecked = field.value.includes(sport._id);
                    return (
                      <label
                        key={sport._id}
                        className="flex items-center space-x-2 text-xs font-medium cursor-pointer p-1.5 hover:bg-slate-100 rounded transition select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSportToggle(sport._id, field)}
                          className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-slate-700">{sport.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.sports && (
              <span className="text-xs text-red-500 font-medium">
                {errors.sports.message}
              </span>
            )}
          </div>

          {/* Image upload */}
          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <ImageUpload
                label="Athlete Profile Photo"
                onChange={field.onChange}
                value={field.value}
                error={errors.photo}
              />
            )}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition gap-2 shadow-xs mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} /> Save Athlete Profile
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlayerForm;
