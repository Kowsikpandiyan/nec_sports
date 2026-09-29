import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, Edit, FileSpreadsheet, Eye, Filter } from 'lucide-react';
import api from '../../lib/axios';
import useDebounce from '../../hooks/useDebounce';
import usePagination from '../../hooks/usePagination';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

const PlayerList = () => {
  const { user } = useContext(AuthContext);
  
  const [players, setPlayers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [sports, setSports] = useState([]);
  
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);
  const { page, limit, total, setPage, setTotal, pages } = usePagination(10);

  const fetchFilters = async () => {
    try {
      const [deptsRes, sportsRes] = await Promise.all([
        api.get('/departments?limit=100'),
        api.get('/sports?limit=100')
      ]);
      if (deptsRes.data?.data) setDepartments(deptsRes.data.data);
      if (sportsRes.data?.data) setSports(sportsRes.data.data);
    } catch (err) {
      console.error('Failed to load filters');
    }
  };

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit,
        search: debouncedSearch,
        department: selectedDept,
        sport: selectedSport
      });

      const res = await api.get(`/players?${queryParams.toString()}`);
      if (res.data && res.data.data) {
        setPlayers(res.data.data);
        setTotal(res.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error('Failed to fetch player roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [page, debouncedSearch, selectedDept, selectedSport]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/players/${deleteId}`);
      if (res.data && res.data.success) {
        toast.success('Player deleted successfully');
        setPlayers((prev) => prev.filter((p) => p._id !== deleteId));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete player');
    } finally {
      setDeleteId(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await api.get(`/reports/players/excel?deptId=${selectedDept}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'NEC_Athletes_Roster.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Roster exported successfully');
    } catch (err) {
      toast.error('Failed to export players to Excel');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader
        title="Student Athletes"
        description="View, register, and configure player profiles."
      >
        <button
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg border border-slate-205 text-slate-700 bg-white hover:bg-slate-50 transition gap-2 shadow-xs"
        >
          <FileSpreadsheet size={16} className="text-blue-600" /> Export Excel
        </button>

        {['superAdmin', 'coordinator'].includes(user?.role) && (
          <Link
            to="/players/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm gap-2"
          >
            <Plus size={16} /> Register Player
          </Link>
        )}
      </PageHeader>

      {/* Filters Area */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, roll number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white outline-none text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 text-sm"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={16} />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white outline-none text-slate-800 focus:border-blue-500 text-sm cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
        </div>

        {/* Sport Filter */}
        <div className="relative">
          <select
            value={selectedSport}
            onChange={(e) => {
              setSelectedSport(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg bg-white outline-none text-slate-800 focus:border-blue-500 text-sm cursor-pointer"
          >
            <option value="">All Sports</option>
            {sports.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-3 text-slate-400" size={16} />
        </div>
      </div>

      {/* Roster Table Card */}
      {loading ? (
        <Skeleton type="table" count={6} />
      ) : players.length === 0 ? (
        <EmptyState
          title="No athletes matching query"
          description="Try adjusting your filter selectors or register a new player profile."
        />
      ) : (
        <div className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-2xs font-bold">
                <tr>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Jersey</th>
                  <th className="px-6 py-4">Enrolled Sports</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {players.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 flex items-center space-x-3">
                      <Avatar src={p.photo} name={p.name} size="sm" />
                      <div className="font-semibold text-slate-900">
                        {p.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">{p.rollNumber}</td>
                    <td className="px-6 py-4 text-xs">{p.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 font-extrabold text-xs">
                      {p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}
                    </td>
                    <td className="px-6 py-4 gap-1.5 flex flex-wrap max-w-xs">
                      {p.sports?.map((s) => (
                        <Badge key={s._id} variant="info" className="text-3xs">
                          {s.name}
                        </Badge>
                      )) || '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        to={`/players/${p._id}`}
                        className="p-1.5 inline-block rounded-lg border border-slate-200 text-slate-500 hover:text-blue-500 hover:bg-slate-100 transition"
                        aria-label="View player details"
                      >
                        <Eye size={14} />
                      </Link>
                      {['superAdmin', 'coordinator'].includes(user?.role) && (
                        <>
                          <Link
                            to={`/players/${p._id}/edit`}
                            className="p-1.5 inline-block rounded-lg border border-slate-200 text-slate-500 hover:text-amber-500 hover:bg-slate-100 transition"
                            aria-label="Edit player"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(p._id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-slate-100 transition"
                            aria-label="Delete player"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Player Profile"
        message="Are you sure you want to remove this player profile? This action cannot be undone."
      />
    </div>
  );
};

export default PlayerList;
