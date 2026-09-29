import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Trophy } from 'lucide-react';
import api from '../../lib/axios';
import FormInput from '../../components/forms/FormInput';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

// Validation Schema
const sportSchema = z.object({
  name: z.string().min(2, 'Sport name is required'),
  description: z.string().optional(),
  maxPlayersPerTeam: z.coerce.number().min(1, 'Need at least 1 player per team'),
  eventTypesRaw: z.string().min(1, 'Timeline action types are required (comma separated)')
});

const SportForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(sportSchema),
    defaultValues: {
      name: '',
      description: '',
      maxPlayersPerTeam: 11,
      eventTypesRaw: 'Goal, Yellow Card, Red Card, Assist'
    }
  });

  const loadSportData = async () => {
    if (!isEdit) return;
    try {
      const res = await api.get(`/sports/${id}`);
      if (res.data && res.data.data) {
        const sport = res.data.data;
        setValue('name', sport.name);
        setValue('description', sport.description || '');
        setValue('maxPlayersPerTeam', sport.maxPlayersPerTeam);
        setValue('eventTypesRaw', sport.eventTypes?.join(', ') || '');
      }
    } catch (err) {
      toast.error('Failed to load sport configuration details');
    }
  };

  useEffect(() => {
    loadSportData();
  }, [id]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const eventTypesList = data.eventTypesRaw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        name: data.name,
        description: data.description || '',
        maxPlayersPerTeam: data.maxPlayersPerTeam,
        eventTypes: eventTypesList
      };

      let res;
      if (isEdit) {
        res = await api.put(`/sports/${id}`, payload);
      } else {
        res = await api.post('/sports', payload);
      }

      if (res.data && res.data.success) {
        toast.success(isEdit ? 'Sport updated' : 'Sport created successfully');
        navigate('/sports');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit sport configurations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/sports"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1 mb-2"
        >
          <ArrowLeft size={14} /> Back to Sports
        </Link>
        <PageHeader
          title={isEdit ? 'Edit Sport Class' : 'Add Sport Category'}
          description={isEdit ? 'Modify rules and parameters.' : 'Configure a new sport code for matchups.'}
        />
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-205 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormInput
            label="Sport Name"
            name="name"
            placeholder="e.g. Football or Cricket"
            required
            error={errors.name}
            {...register('name')}
          />

          <FormInput
            label="Max Roster Players per Team"
            name="maxPlayersPerTeam"
            type="number"
            required
            error={errors.maxPlayersPerTeam}
            {...register('maxPlayersPerTeam')}
          />

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs md:text-sm font-semibold text-slate-700">
              Timeline Action Event Types (Comma-Separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Goal, Assist, Yellow Card, Red Card"
              className={`px-3 py-2 text-sm rounded-lg bg-white border transition outline-none ${
                errors.eventTypesRaw ? 'border-red-500' : 'border-slate-350'
              } text-slate-800`}
              {...register('eventTypesRaw')}
            />
            <p className="text-4xs text-slate-400">
              Coordinators and scorers can select from these options during match actions logging.
            </p>
            {errors.eventTypesRaw && (
              <span className="text-xs text-red-500 font-medium">
                {errors.eventTypesRaw.message}
              </span>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-xs md:text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Provide simple rules, match timings, or guidelines..."
              className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-350 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none text-slate-800 placeholder-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition gap-2 shadow-xs mt-4"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} /> Save Sport Configuration
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SportForm;
