import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy, Timestamp, limit, writeBatch } from 'firebase/firestore';
import { Dissertation, DissertationStatus, UserProfile } from '../types';
import AdminSettings from './AdminSettings';
import AuditLogs from '../components/AuditLogs';
import AcademicManagement from '../components/AcademicManagement';
import UserManagement from '../components/UserManagement';
import { useAcademic } from '../components/AcademicContext';
import { LayoutDashboard, FileText, CheckCircle, XCircle, Clock, AlertCircle, Loader2, BarChart3, Users, Building2, GraduationCap, ChevronRight, Eye, MessageSquare, Send, Check, X, RefreshCcw, Settings, TrendingUp, Download, Search, Shield, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';

import { useSettings } from '../components/SettingsContext';

const Dashboard: React.FC<{ onViewDetail: (dissId: string) => void }> = ({ onViewDetail }) => {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const { schools, departments } = useAcademic();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'manage' | 'settings' | 'audit' | 'academic' | 'users'>('overview');
  const [dissertations, setDissertations] = useState<Dissertation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDissIds, setSelectedDissIds] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    revision: 0,
    totalDownloads: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [downloadTrendData, setDownloadTrendData] = useState<any[]>([]);
  const [recentDownloads, setRecentDownloads] = useState<any[]>([]);
  const [authorStats, setAuthorStats] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !profile) return;

    let q;
    const dissRef = collection(db, 'dissertations');

    if (profile.role === 'super_admin') {
      q = query(dissRef, orderBy('createdAt', 'desc'));
    } else if (profile.role === 'school_admin') {
      q = query(dissRef, where('schoolId', '==', profile.schoolId), orderBy('createdAt', 'desc'));
    } else if (profile.role === 'lecturer') {
      q = query(dissRef, where('schoolId', '==', profile.schoolId), orderBy('createdAt', 'desc'));
    } else {
      q = query(dissRef, where('uploadedBy', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dissertation));
      setDissertations(docs);
      
      const newStats = {
        total: docs.length,
        pending: docs.filter(d => d.status === 'pending').length,
        approved: docs.filter(d => d.status === 'approved').length,
        rejected: docs.filter(d => d.status === 'rejected').length,
        revision: docs.filter(d => d.status === 'revision_requested').length,
        totalDownloads: docs.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0)
      };
      setStats(newStats);

      // Prepare Chart Data (by School)
      const schoolCounts = schools.map(school => ({
        name: school.name.replace('School of ', ''),
        count: docs.filter(d => d.schoolId === school.id).length
      }));
      setChartData(schoolCounts);

      // Prepare Author Stats (Top 5 Supervisors)
      const supervisorMap = new Map<string, { count: number, downloads: number }>();
      docs.forEach(d => {
        if (d.supervisorName) {
          const current = supervisorMap.get(d.supervisorName) || { count: 0, downloads: 0 };
          supervisorMap.set(d.supervisorName, {
            count: current.count + 1,
            downloads: current.downloads + (d.downloadCount || 0)
          });
        }
      });

      const sortedAuthors = Array.from(supervisorMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setAuthorStats(sortedAuthors);

      // Prepare Pie Data (by Status)
      const statusData = [
        { name: 'Approved', value: newStats.approved, color: '#10b981' },
        { name: 'Pending', value: newStats.pending, color: '#f59e0b' },
        { name: 'Revision', value: newStats.revision, color: '#3b82f6' },
        { name: 'Rejected', value: newStats.rejected, color: '#ef4444' }
      ].filter(d => d.value > 0);
      setPieData(statusData);

      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'dissertations');
    });

    // Fetch Download Trends & History (Admins only)
    let unsubscribeDownloads = () => {};
    if (profile.role === 'super_admin' || profile.role === 'school_admin') {
      const downloadQ = query(collection(db, 'downloads'), orderBy('timestamp', 'desc'), limit(100));
      unsubscribeDownloads = onSnapshot(downloadQ, (snapshot) => {
        const downloads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Set recent downloads (limit to 10)
        setRecentDownloads(downloads.slice(0, 10));

        // Group by date
        const grouped = downloads.reduce((acc: any, curr: any) => {
          const date = curr.timestamp?.toDate().toLocaleDateString() || 'Unknown';
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const trendData = Object.entries(grouped).map(([date, count]) => ({
          date,
          downloads: count
        })).reverse();

        setDownloadTrendData(trendData);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'downloads');
      });
    }

    return () => {
      unsubscribe();
      unsubscribeDownloads();
    };
  }, [user, profile, schools]);

  const handleStatusUpdate = async (dissId: string, newStatus: DissertationStatus, comment?: string) => {
    try {
      const dissRef = doc(db, 'dissertations', dissId);
      await updateDoc(dissRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        ...(comment && { comments: comment })
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: DissertationStatus) => {
    if (selectedDissIds.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      selectedDissIds.forEach(id => {
        const ref = doc(db, 'dissertations', id);
        batch.update(ref, {
          status: newStatus,
          updatedAt: Timestamp.now()
        });
      });
      await batch.commit();
      setSelectedDissIds([]);
    } catch (error) {
      console.error('Bulk update error:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDissIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedDissIds.length === dissertations.length) {
      setSelectedDissIds([]);
    } else {
      setSelectedDissIds(dissertations.map(d => d.id));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Loading Dashboard...</p>
      </div>
    );
  }

  const isSuperAdmin = profile?.role === 'super_admin';

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-emerald-600" />
            {profile?.role.replace('_', ' ').toUpperCase()} Dashboard
          </h1>
          <p className="text-stone-500">Welcome back, {profile?.displayName}. Manage your academic research repository.</p>
        </div>
        
        {isSuperAdmin && (
          <div className="flex flex-wrap bg-white border border-stone-200 rounded-2xl p-1 shadow-sm">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'overview' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSubTab('manage')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'manage' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Manage
            </button>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'users' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveSubTab('academic')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'academic' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Academic
            </button>
            <button
              onClick={() => setActiveSubTab('settings')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'settings' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubTab === 'audit' ? 'bg-emerald-600 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Audit
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Pending Approval" value={stats.pending} icon={Clock} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
              <StatCard label="Approved" value={stats.approved} icon={CheckCircle} color="text-emerald-600" bg="bg-emerald-50" border="border-emerald-100" />
              <StatCard label="Total Downloads" value={stats.totalDownloads} icon={Download} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
              <StatCard label="Total Submissions" value={stats.total} icon={FileText} color="text-stone-600" bg="bg-stone-50" border="border-stone-100" />
            </div>

            {/* Charts & Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: settings.primaryColor }} />
                    Submissions by School
                  </h3>
                </div>
                <div className="h-64 w-full min-h-[256px]">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Bar dataKey="count" fill={settings.primaryColor} radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-stone-400 text-sm italic">
                      No submission data available.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Download Trends
                </h3>
                <div className="h-64 w-full min-h-[256px]">
                  {downloadTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart data={downloadTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="downloads" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-stone-400 text-sm italic">
                      No download trend data available.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Author Statistics */}
            <div className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-stone-600" />
                  Top Supervisors Statistics
                </h3>
              </div>
              <div className="h-80 w-full min-h-[320px]">
                {authorStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={authorStats} layout="vertical" margin={{ left: 40, right: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#1e293b', fontWeight: 'bold' }} width={120} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="count" name="Dissertations" fill={settings.primaryColor} radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey="downloads" name="Downloads" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-stone-400 text-sm italic">
                    No supervisor statistics available.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    Recent Submissions
                  </h3>
                  <button 
                    onClick={() => setActiveSubTab('manage')}
                    className="text-xs font-bold text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Title & Author</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {dissertations.slice(0, 5).map((diss) => (
                        <tr key={diss.id} className="hover:bg-stone-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-stone-900 line-clamp-1">{diss.title}</p>
                              <p className="text-xs text-stone-500">{diss.studentName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={diss.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => onViewDetail(diss.id)}
                              className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {(isSuperAdmin || profile?.role === 'school_admin') && (
                <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                      <Download className="w-5 h-5 text-blue-600" />
                      Recent Downloads
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50/50">
                          <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Dissertation</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">User</th>
                          <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {recentDownloads.length > 0 ? (
                          recentDownloads.map((dl) => (
                            <tr key={dl.id} className="hover:bg-stone-50/50 transition-colors group">
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-stone-900 line-clamp-1">{dl.dissertationTitle || 'Unknown Title'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-stone-500">{dl.userName || 'Anonymous'}</p>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <p className="text-[10px] text-stone-400">{dl.timestamp?.toDate().toLocaleString()}</p>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="px-6 py-10 text-center text-stone-400 text-xs italic">
                              No recent downloads recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSubTab === 'manage' && (
          <motion.div
            key="manage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50/50">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-stone-900">Manage Submissions</h3>
                {selectedDissIds.length > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl animate-in fade-in slide-in-from-left-2">
                    <span className="text-xs font-bold text-emerald-700">{selectedDissIds.length} Selected</span>
                    <div className="h-4 w-px bg-emerald-200 mx-1" />
                    <button 
                      onClick={() => handleBulkStatusUpdate('approved')}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-widest"
                    >
                      Approve All
                    </button>
                    <button 
                      onClick={() => handleBulkStatusUpdate('revision_requested')}
                      className="text-[10px] font-bold text-amber-600 hover:text-amber-800 uppercase tracking-widest"
                    >
                      Request Revision
                    </button>
                    <button 
                      onClick={() => handleBulkStatusUpdate('rejected')}
                      className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase tracking-widest"
                    >
                      Reject All
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input 
                  type="text" 
                  placeholder="Filter by name or title..." 
                  className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/50">
                    <th className="px-6 py-4 w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedDissIds.length === dissertations.length && dissertations.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Title & Author</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">School / Dept</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Downloads</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dissertations.map((diss) => (
                    <tr key={diss.id} className={`hover:bg-stone-50/50 transition-colors group ${selectedDissIds.includes(diss.id) ? 'bg-emerald-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedDissIds.includes(diss.id)}
                          onChange={() => toggleSelect(diss.id)}
                          className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-stone-900 line-clamp-1">{diss.title}</p>
                          <p className="text-xs text-stone-500">{diss.studentName}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-stone-700">
                            {schools.find(s => s.id === diss.schoolId)?.name || 'Unknown School'}
                          </p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                            {departments.find(d => d.id === diss.departmentId)?.name || 'Unknown Department'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={diss.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-stone-600">
                          <Download className="w-3 h-3 text-stone-400" />
                          {diss.downloadCount || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onViewDetail(diss.id)}
                            className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {diss.status === 'approved' && diss.fileUrl && (
                            <a 
                              href={diss.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          {(isSuperAdmin || profile?.role === 'school_admin' || profile?.role === 'lecturer') && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleStatusUpdate(diss.id, 'approved')}
                                className={`p-2 rounded-lg transition-all ${diss.status === 'approved' ? 'text-emerald-600 bg-emerald-50' : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                title="Approve"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(diss.id, 'revision_requested')}
                                className={`p-2 rounded-lg transition-all ${diss.status === 'revision_requested' ? 'text-amber-600 bg-amber-50' : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                title="Request Revision"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleStatusUpdate(diss.id, 'rejected')}
                                className={`p-2 rounded-lg transition-all ${diss.status === 'rejected' ? 'text-red-600 bg-red-50' : 'text-stone-400 hover:text-red-600 hover:bg-red-50'}`}
                                title="Reject"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeSubTab === 'users' && isSuperAdmin && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <UserManagement />
          </motion.div>
        )}

        {activeSubTab === 'settings' && isSuperAdmin && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AdminSettings />
          </motion.div>
        )}

        {activeSubTab === 'academic' && isSuperAdmin && (
          <motion.div
            key="academic"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AcademicManagement />
          </motion.div>
        )}

        {activeSubTab === 'audit' && isSuperAdmin && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AuditLogs />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bg, border }: any) => (
  <div className={`p-6 rounded-3xl border ${border} ${bg} shadow-sm space-y-4`}>
    <div className={`inline-flex p-3 rounded-2xl bg-white shadow-sm ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <p className="text-2xl font-bold text-stone-900">{value}</p>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: DissertationStatus }) => {
  const configs = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
    revision_requested: { label: 'Revision', color: 'bg-blue-100 text-blue-700', icon: RefreshCcw },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default Dashboard;
