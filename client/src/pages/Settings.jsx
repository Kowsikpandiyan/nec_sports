import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../lib/axios';
import PageHeader from '../components/common/PageHeader';
import ImageUpload from '../components/forms/ImageUpload';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Save, RefreshCw, ToggleLeft, ShieldAlert } from 'lucide-react';

const Settings = () => {
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  
  // Form states
  const [collegeName, setCollegeName] = useState('');
  const [allowRegistration, setAllowRegistration] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');

  const collegeId = typeof user?.college === 'object' ? user?.college?._id : user?.college;

  const fetchSettings = async () => {
    if (!collegeId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get(`/settings/${collegeId}`);
      if (res.data && res.data.data) {
        const d = res.data.data;
        setSettingsId(d._id);
        setCollegeName(d.collegeName);
        setAllowRegistration(d.allowPublicRegistration || false);
        setLogoUrl(d.logo || '');
      }
    } catch (err) {
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [collegeId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!collegeId) return;

    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('collegeName', collegeName);
      formData.append('primaryColor', '#2756F5'); // Fixed — always NEC Blue
      formData.append('darkMode', false);          // Fixed — always light mode
      formData.append('allowPublicRegistration', allowRegistration);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const res = await api.put(`/settings/${collegeId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        toast.success('App settings updated successfully');
        if (res.data.data) {
          setLogoUrl(res.data.data.logo || '');
          setLogoFile(null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!collegeId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex items-start gap-4">
          <ShieldAlert className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-800">Settings Unavailable</h3>
            <p className="text-red-700 mt-1">
              Your user account is not associated with any college. General app settings are managed through college-specific instances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="App Settings" 
        subtitle="Manage your tournament platform's college identity and access rules"
      />

      <form onSubmit={handleSave} className="space-y-6">

        {/* Section 1: College Identity */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-800">College Identity</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  College Name
                </label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 bg-white rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="e.g. NEC College of Engineering"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  This name appears in the Navbar and all documents.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <label className="block text-sm font-semibold text-gray-700 mb-3 self-start md:self-center">
                  College Logo
                </label>
                <ImageUpload
                  value={logoFile || logoUrl}
                  onChange={(file) => {
                    setLogoFile(file);
                    if (!file) setLogoUrl(''); // clear stale URL so upload picker appears
                  }}
                  className="w-32 h-32 rounded-xl object-contain border border-gray-200 p-2"
                />
                <p className="text-xs text-gray-400 mt-2 text-center">PNG or JPG, square preferred</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fixed Theme Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#2756F5' }}
          >
            <span className="text-white font-black text-lg">N</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">Fixed NEC LMS Theme</h3>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              The application uses a permanent <strong>Blue + White</strong> theme inspired by NEC LMS.
              Theme switching, color pickers, and dark mode are disabled to ensure a consistent, 
              professional appearance for all users.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-block w-5 h-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: '#2756F5' }} />
              <span className="text-xs text-blue-800 font-semibold">#2756F5 — Primary Blue (fixed)</span>
            </div>
          </div>
        </div>

        {/* Section 3: Access Control */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
            <ToggleLeft className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-800">Access Control</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Allow Public Registration</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Allow students and team coordinators to self-register their accounts.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="sr-only peer"
                  id="allow-registration-toggle"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={fetchSettings}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="submit"
            id="settings-save-btn"
            disabled={saving}
            className="px-5 py-2.5 text-white font-semibold rounded-lg shadow-sm transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            style={{ backgroundColor: '#2756F5' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.backgroundColor = '#1E40AF'; }}
            onMouseLeave={e => { if (!saving) e.currentTarget.style.backgroundColor = '#2756F5'; }}
          >
            {saving ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
