import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Trophy } from 'lucide-react';
import api from '../../lib/axios';
import FormInput from '../../components/forms/FormInput';
import FormSelect from '../../components/forms/FormSelect';
import FormDatePicker from '../../components/forms/FormDatePicker';
import ImageUpload from '../../components/forms/ImageUpload';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

// Validation Schema
const tourneySchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters'),
  sport: z.string().min(1, 'Please select a sport category'),
  college: z.string().min(1, 'Please select a college reference'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  venue: z.string().min(1, 'Please select a venue location'),
  format: z.enum(['knockout', 'league', 'roundRobin'], {
    errorMap: () => ({ message: 'Please select a match format' })
  }),
  rules: z.string().optional()
});

const TournamentForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(tourneySchema),
    defaultValues: {
      name: '',
      sport: '',
      college: '',
      startDate: '',
      endDate: '',
      venue: '',
      format: 'knockout',
      rules: '',
      banner: null
    }
  });

  const fetchDropdowns = async () => {
    try {
      const [collegesRes, sportsRes, venuesRes] = await Promise.all([
        api.get('/colleges?limit=100'),
        api.get('/sports?limit=100'),
        api.get('/venues?limit=100')
      ]);

      if (collegesRes.data?.data) {
        setColleges(collegesRes.data.data.map(c => ({ value: c._id, label: c.name })));
        if (collegesRes.data.data.length === 1 && !isEdit) {
          setValue('college', collegesRes.data.data[0]._id);
        }
      }

      if (sportsRes.data?.data) {
        setSports(sportsRes.data.data.map(s => ({ value: s._id, label: s.name })));
      }

      if (venuesRes.data?.data) {
        setVenues(venuesRes.data.data.map(v => ({ value: v._id, label: `${v.name} (${v.location})` })));
      }
    } catch (err) {
      toast.error('Failed to load dropdown lists');
    }
  };

  const loadTournamentData = async () => {
    if (!isEdit) return;
    try {
      const res = await api.get(`/tournaments/${id}`);
      if (res.data && res.data.data) {
        const t = res.data.data;
        setValue('name', t.name);
        setValue('sport', t.sport?._id || t.sport);
        setValue('college', t.college?._id || t.college);
        setValue('startDate', new Date(t.startDate).toISOString().slice(0, 16)); // Format to datetime-local compatible
        setValue('endDate', new Date(t.endDate).toISOString().slice(0, 16));
        setValue('venue', t.venue?._id || t.venue);
        setValue('format', t.format);
        setValue('rules', t.rules || '');
        setValue('banner', t.banner || '');
      }
    } catch (err) {
      toast.error('Failed to load tournament data');
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    if (colleges.length > 0) {
      loadTournamentData();
    }
  }, [id, colleges]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('sport', data.sport);
      formData.append('college', data.college);
      formData.append('startDate', data.startDate);
      formData.append('endDate', data.endDate);
      formData.append('venue', data.venue);
      formData.append('format', data.format);
      formData.append('rules', data.rules || '');

      if (data.banner instanceof File) {
        formData.append('banner', data.banner);
      }

      let res;
      if (isEdit) {
        res = await api.put(`/tournaments/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/tournaments', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data && res.data.success) {
        toast.success(isEdit ? 'Tournament updated' : 'Tournament scheduled successfully');
        navigate('/tournaments');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit tournament details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/tournaments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1 mb-2"
        >
          <ArrowLeft size={14} /> Back to Tournaments
        </Link>
        <PageHeader
          title={isEdit ? 'Edit Tournament Settings' : 'Schedule Tournament'}
          description={isEdit ? 'Modify scheduling details.' : 'Initialize a new sports tournament on campus.'}
        />
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-205 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput
            label="Tournament Name"
            name="name"
            placeholder="e.g. NEC Cricket Premier League 2025"
            required
            error={errors.name}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Sport Category"
              name="sport"
              options={sports}
              required
              error={errors.sport}
              {...register('sport')}
            />

            <FormSelect
              label="College Arena"
              name="college"
              options={colleges}
              required
              error={errors.college}
              {...register('college')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormDatePicker
              label="Start Date & Time"
              name="startDate"
              showTime={true}
              required
              error={errors.startDate}
              {...register('startDate')}
            />

            <FormDatePicker
              label="End Date & Time"
              name="endDate"
              showTime={true}
              required
              error={errors.endDate}
              {...register('endDate')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Venue Location"
              name="venue"
              options={venues}
              required
              error={errors.venue}
              {...register('venue')}
            />

            <FormSelect
              label="Tournament Format"
              name="format"
              options={[
                { value: 'knockout', label: 'Knockout Bracket' },
                { value: 'league', label: 'League matches' },
                { value: 'roundRobin', label: 'Round Robin' }
              ]}
              required
              error={errors.format}
              {...register('format')}
            />
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs md:text-sm font-semibold text-slate-700">
              Rules & Regulations
            </label>
            <textarea
              {...register('rules')}
              rows={4}
              placeholder="List down standard timings, direct qualifying criteria or penalty suspension rules..."
              className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Banner */}
          <Controller
            control={control}
            name="banner"
            render={({ field }) => (
              <ImageUpload
                label="Tournament Cover Banner"
                onChange={field.onChange}
                value={field.value}
                error={errors.banner}
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
                <Save size={16} /> Save Tournament
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TournamentForm;
