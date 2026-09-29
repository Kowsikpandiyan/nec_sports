import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, Edit, Award, User, HelpCircle } from 'lucide-react';
import api from '../../lib/axios';
import useDebounce from '../../hooks/useDebounce';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const DepartmentList = () => {
  const { user } = useContext(AuthContext);
  
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  
  const debouncedSearch = useDebounce(search, 300);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/departments?search=${debouncedSearch}`);
      if (res.data && res.data.data) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [debouncedSearch]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/departments/${deleteId}`);
      if (res.data && res.data.success) {
        toast.success('Department deleted successfully');
        setDepartments(prev => prev.filter(d => d._id !== deleteId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleteId(null);
    }
  };

  const getFullLogoUrl = (logo) => {
    if (!logo) return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop';
    if (logo.startsWith('/uploads')) {
      return `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${logo}`;
    }
    return logo;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader
        title="College Departments"
        description="View and manage the departments registered in the sports hub."
      >
        {user?.role === 'superAdmin' && (
          <Link
            to="/departments/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm gap-2"
          >
            <Plus size={16} /> Add Department
          </Link>
        )}
      </PageHeader>

      {/* Search Filter bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by department name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white outline-none text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
        />
        <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
      </div>

      {/* Grid of Department Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton type="card" count={6} />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          title="No departments found"
          description="Could not find any departments. Try adjusting your search term."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-md transition duration-200"
            >
              
              {/* Logo & Basic Info */}
              <div className="p-5 space-y-4">
                <div className="flex items-center space-x-4">
                  <img
                    src={getFullLogoUrl(dept.logo)}
                    alt={`${dept.name} logo`}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100"
                  />
                  <div>
                    <Link
                      to={`/departments/${dept._id}`}
                      className="text-base font-extrabold text-slate-900 hover:text-blue-500 transition line-clamp-1"
                    >
                      {dept.name}
                    </Link>
                    <p className="text-2xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <User size={12} /> {dept.coordinatorName}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {dept.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats Bar (Players Count & Teams count) */}
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                <div className="flex space-x-4 text-slate-500">
                  <span>
                    Players: <strong className="text-slate-700">{dept.playerCount || 0}</strong>
                  </span>
                  <span>
                    Teams: <strong className="text-slate-700">{dept.teamCount || 0}</strong>
                  </span>
                </div>

                {/* Edit & Delete Action Panel */}
                <div className="flex items-center space-x-2">
                  {['superAdmin', 'coordinator'].includes(user?.role) && (
                    <Link
                      to={`/departments/${dept._id}/edit`}
                      className="p-1 rounded text-slate-500 hover:text-blue-500 hover:bg-slate-100"
                      aria-label="Edit department"
                    >
                      <Edit size={14} />
                    </Link>
                  )}
                  {user?.role === 'superAdmin' && (
                    <button
                      onClick={() => setDeleteId(dept._id)}
                      className="p-1 rounded text-slate-500 hover:text-red-500 hover:bg-slate-100"
                      aria-label="Delete department"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message="Are you sure you want to delete this department? All associated teams and athlete references might be affected. This action is irreversible."
      />
    </div>
  );
};

export default DepartmentList;
