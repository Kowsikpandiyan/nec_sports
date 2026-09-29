import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Save, ArrowLeft, Shield } from 'lucide-react';
import api from '../../lib/axios';
import FormSelect from '../../components/forms/FormSelect';
import FormInput from '../../components/forms/FormInput';
import ImageUpload from '../../components/forms/ImageUpload';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

// Validation Schema
const teamSchema = z.object({
  tournament: z.string().min(1, 'Please select a tournament'),
  department: z.string().min(1, 'Please select a department'),
  coach: z.string().min(1, 'Coach name is required'),
  players: z.array(z.string()).min(2, 'Select at least 2 players to form a team roster'),
  captain: z.string().min(1, 'Please nominate a team captain'),
  viceCaptain: z.string().min(1, 'Please nominate a vice-captain')
}).refine((data) => data.captain !== data.viceCaptain, {
  message: "Captain and Vice-Captain cannot be the same athlete",
  path: ['viceCaptain']
});

const TeamForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [tournaments, setTournaments] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Players registered under selected department
  const [availablePlayers, setAvailablePlayers] = useState([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      tournament: '',
      department: '',
      coach: '',
      players: [],
      captain: '',
      viceCaptain: '',
      photo: null
    }
  });

  const selectedDept = watch('department');
  const selectedPlayers = watch('players') || [];

  const fetchDropdowns = async () => {
    try {
      const [tourneysRes, deptsRes] = await Promise.all([
        api.get('/tournaments?limit=100'),
        api.get('/departments?limit=100')
      ]);

      if (tourneysRes.data?.data) {
        setTournaments(tourneysRes.data.data.map(t => ({ value: t._id, label: t.name })));
      }

      if (deptsRes.data?.data) {
        setDepartments(deptsRes.data.data.map(d => ({ value: d._id, label: d.name })));
      }
    } catch (err) {
      toast.error('Failed to load dropdown lists');
    }
  };

  const fetchPlayersByDepartment = async (deptId) => {
    try {
      const res = await api.get(`/players/department/${deptId}`);
      if (res.data && res.data.data) {
        setAvailablePlayers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch player roster for department: ', deptId);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  // Fetch athletes when department changes
  useEffect(() => {
    if (selectedDept) {
      fetchPlayersByDepartment(selectedDept);
      
      // Wipe selections if department is reset
      if (!isEdit) {
        setValue('players', []);
        setValue('captain', '');
        setValue('viceCaptain', '');
      }
    } else {
      setAvailablePlayers([]);
    }
  }, [selectedDept]);

  const loadTeamData = async () => {
    if (!isEdit) return;
    try {
      const res = await api.get(`/teams/${id}`);
      if (res.data && res.data.data) {
        const team = res.data.data;
        setValue('tournament', team.tournament?._id || team.tournament);
        setValue('department', team.department?._id || team.department);
        setValue('coach', team.coach || '');
        
        // Wait briefly to fetch players for this dept
        await fetchPlayersByDepartment(team.department?._id || team.department);
        
        setValue('players', team.players?.map(p => p._id || p) || []);
        setValue('captain', team.captain?._id || team.captain);
        setValue('viceCaptain', team.viceCaptain?._id || team.viceCaptain);
        setValue('photo', team.photo || '');
      }
    } catch (err) {
      toast.error('Failed to load team data');
    }
  };

  useEffect(() => {
    if (departments.length > 0) {
      loadTeamData();
    }
  }, [id, departments]);

  const handlePlayerCheckboxToggle = (playerId, field) => {
    const list = [...field.value];
    const index = list.indexOf(playerId);
    if (index > -1) {
      list.splice(index, 1);
    } else {
      list.push(playerId);
    }
    field.onChange(list);

    // Validate that captain/viceCaptain selection remains valid
    const isCapInList = list.includes(watch('captain'));
    const isVCInList = list.includes(watch('viceCaptain'));

    if (!isCapInList) setValue('captain', '');
    if (!isVCInList) setValue('viceCaptain', '');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('tournament', data.tournament);
      formData.append('department', data.department);
      formData.append('coach', data.coach || '');
      formData.append('players', JSON.stringify(data.players));
      formData.append('captain', data.captain);
      formData.append('viceCaptain', data.viceCaptain);

      if (data.photo instanceof File) {
        formData.append('photo', data.photo);
      }

      let res;
      if (isEdit) {
        res = await api.put(`/teams/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/teams', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data && res.data.success) {
        toast.success(isEdit ? 'Roster updated successfully' : 'Roster submitted successfully and is pending approval.');
        navigate('/teams');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit team registration details');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlayersRosterOptions = availablePlayers
    .filter((p) => selectedPlayers.includes(p._id))
    .map((p) => ({ value: p._id, label: p.name }));

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1 mb-2"
        >
          <ArrowLeft size={14} /> Back to Teams List
        </Link>
        <PageHeader
          title={isEdit ? 'Edit Team Roster' : 'Register Tournament Team'}
          description={isEdit ? 'Modify roster credentials.' : 'Submit a new department sports team roster.'}
        />
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSelect
            label="Tournament Reference"
            name="tournament"
            options={tournaments}
            required
            disabled={isEdit}
            error={errors.tournament}
            {...register('tournament')}
          />

          <FormSelect
            label="Department"
            name="department"
            options={departments}
            required
            disabled={isEdit}
            error={errors.department}
            {...register('department')}
          />

          <FormInput
            label="Team Coach Name"
            name="coach"
            placeholder="e.g. Coach Arun"
            required
            error={errors.coach}
            {...register('coach')}
          />

          {/* Player roster checkboxes */}
          <div className="flex flex-col space-y-1.5">
            <span className="text-xs md:text-sm font-semibold text-slate-700">
              Select Roster Players (Check all that apply) <span className="text-red-500">*</span>
            </span>

            {selectedDept ? (
              availablePlayers.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border rounded-xl bg-slate-50/50">
                  No players registered under this department yet. Please add players first.
                </div>
              ) : (
                <Controller
                  control={control}
                  name="players"
                  render={({ field }) => (
                    <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-40 overflow-y-auto">
                      {availablePlayers.map((p) => {
                        const isChecked = field.value.includes(p._id);
                        return (
                          <label
                            key={p._id}
                            className="flex items-center space-x-2 text-xs font-medium cursor-pointer p-1.5 hover:bg-slate-105 rounded transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePlayerCheckboxToggle(p._id, field)}
                              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-slate-750">{p.name} (#{p.jerseyNumber})</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                />
              )
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50/50">
                Select a department above to see available athletes.
              </div>
            )}
            {errors.players && (
              <span className="text-xs text-red-500 font-medium">
                {errors.players.message}
              </span>
            )}
          </div>

          {/* Captain & Vice captain options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Nominated Captain"
              name="captain"
              options={selectedPlayersRosterOptions}
              required
              disabled={selectedPlayers.length === 0}
              placeholder={selectedPlayers.length === 0 ? 'Select players first' : 'Select Captain'}
              error={errors.captain}
              {...register('captain')}
            />

            <FormSelect
              label="Nominated Vice-Captain"
              name="viceCaptain"
              options={selectedPlayersRosterOptions}
              required
              disabled={selectedPlayers.length === 0}
              placeholder={selectedPlayers.length === 0 ? 'Select players first' : 'Select Vice-Captain'}
              error={errors.viceCaptain}
              {...register('viceCaptain')}
            />
          </div>

          {/* photo upload */}
          <Controller
            control={control}
            name="photo"
            render={({ field }) => (
              <ImageUpload
                label="Team Group Photo"
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
                <Save size={16} /> Submit Team Roster
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;
