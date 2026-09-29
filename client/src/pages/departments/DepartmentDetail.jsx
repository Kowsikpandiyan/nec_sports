import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, User, Users, Shield, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const DepartmentDetail = () => {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('players'); // 'players' | 'teams'

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const [deptRes, playersRes, teamsRes] = await Promise.all([
        api.get(`/departments/${id}`),
        api.get(`/departments/${id}/players`),
        api.get(`/departments/${id}/teams`)
      ]);

      if (deptRes.data && deptRes.data.data) {
        setDepartment(deptRes.data.data);
      }
      if (playersRes.data && playersRes.data.data) {
        setPlayers(playersRes.data.data);
      }
      if (teamsRes.data && teamsRes.data.data) {
        setTeams(teamsRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load department details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading) {
    return <Skeleton type="card" count={3} />;
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Department not found</h3>
        <Link to="/departments" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to Departments
        </Link>
      </div>
    );
  }

  const logoUrl = department.logo?.startsWith('/uploads') 
    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${department.logo}` 
    : (department.logo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop');

  return (
    <div className="space-y-6">
      
      {/* Back link */}
      <div>
        <Link
          to="/departments"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1"
        >
          <ArrowLeft size={14} /> Back to Departments
        </Link>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <img
          src={logoUrl}
          alt={`${department.name} logo`}
          className="w-24 h-24 rounded-2xl object-cover border border-slate-100"
        />

        <div className="text-center md:text-left space-y-2 flex-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">
            {department.name}
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500">
            <p>
              Coordinator: <strong className="text-slate-700">{department.coordinatorName}</strong>
            </p>
            <p>
              Coach: <strong className="text-slate-700">{department.coachName || 'None'}</strong>
            </p>
            {department.captain && (
              <p>
                Captain: <strong className="text-slate-700">{department.captain.name}</strong>
              </p>
            )}
            <p>
              College: <strong className="text-slate-700">{department.college?.name}</strong>
            </p>
          </div>

          <p className="text-xs text-slate-500 mt-2 border-t border-slate-100 pt-3">
            {department.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6">
        <button
          onClick={() => setActiveTab('players')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'players'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Roster Players ({players.length})
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'teams'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Registered Teams ({teams.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        {activeTab === 'players' ? (
          players.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No players currently registered in this department.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {players.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center space-x-3 p-3 bg-slate-50/50 border border-slate-100 rounded-xl"
                >
                  <img
                    src={p.photo?.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${p.photo}` : p.photo}
                    alt={p.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <Link to={`/players/${p._id}`} className="text-xs font-bold text-slate-850 hover:underline">
                      {p.name}
                    </Link>
                    <p className="text-3xs text-slate-400">
                      Jersey: #{p.jerseyNumber} | {p.position || 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          teams.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No tournament teams currently registered for this department.
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((t) => (
                <div
                  key={t._id}
                  className="flex justify-between items-center p-4 bg-slate-50/50 border border-slate-100 rounded-xl"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-850">
                      {t.tournament?.name}
                    </p>
                    <p className="text-3xs text-slate-400">
                      Coach: {t.coach || 'N/A'} | Players: {t.players?.length || 0}
                    </p>
                  </div>

                  <Badge variant={t.isApproved ? 'success' : 'warning'}>
                    {t.isApproved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DepartmentDetail;
