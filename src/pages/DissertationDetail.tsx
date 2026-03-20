import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Dissertation } from '../types';
import { useAuth } from '../components/AuthContext';
import { useAcademic } from '../components/AcademicContext';
import { useSettings } from '../components/SettingsContext';
import { BookOpen, User, Calendar, GraduationCap, Download, Share2, Quote, ArrowLeft, Sparkles, FileText, CheckCircle, Info, ExternalLink, Loader2, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DissertationDetailProps {
  dissId: string;
  onBack: () => void;
}

const DissertationDetail: React.FC<DissertationDetailProps> = ({ dissId, onBack }) => {
  const { user, profile } = useAuth();
  const { schools, departments } = useAcademic();
  const { settings } = useSettings();
  const [diss, setDiss] = useState<Dissertation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCitation, setShowCitation] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDiss = async () => {
      try {
        const docRef = doc(db, 'dissertations', dissId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDiss({ id: docSnap.id, ...docSnap.data() } as Dissertation);
        }
      } catch (error) {
        console.error('Error fetching dissertation:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiss();

    // Fetch download history for chart
    const q = query(
      collection(db, 'downloads'),
      where('dissertationId', '==', dissId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const downloads = snapshot.docs.map(doc => doc.data());
      
      // Group by date
      const grouped = downloads.reduce((acc: any, curr: any) => {
        const date = curr.timestamp?.toDate().toLocaleDateString() || 'Unknown';
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.entries(grouped).map(([date, count]) => ({
        date,
        downloads: count
      }));

      setDownloadHistory(chartData);
    }, (err) => {
      console.error('Error fetching download history:', err);
    });

    return () => unsubscribe();
  }, [dissId]);

  const handleDownload = async () => {
    if (!diss) return;
    setDownloading(true);
    try {
      // 1. Increment download count in dissertation document
      const dissRef = doc(db, 'dissertations', diss.id);
      await updateDoc(dissRef, {
        downloadCount: increment(1)
      });

      // 2. Log download event
      await addDoc(collection(db, 'downloads'), {
        dissertationId: diss.id,
        dissertationTitle: diss.title,
        timestamp: serverTimestamp(),
        userId: user?.uid || 'anonymous',
        userName: profile?.displayName || 'Anonymous'
      });

      // 3. Open file in new tab
      window.open(diss.fileUrl, '_blank');
      
      // Update local state
      setDiss(prev => prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : null);
    } catch (error) {
      console.error('Error logging download:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <div 
          className="w-16 h-16 border-4 rounded-full animate-spin"
          style={{ borderColor: `${settings.primaryColor}20`, borderTopColor: settings.primaryColor }}
        ></div>
        <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Retrieving Research...</p>
      </div>
    );
  }

  if (!diss) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-stone-900">Dissertation not found</h2>
        <button 
          onClick={onBack} 
          className="mt-4 font-bold"
          style={{ color: settings.primaryColor }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const schoolName = schools.find(s => s.id === diss.schoolId)?.name || 'Unknown School';
  const deptName = departments.find(d => d.id === diss.departmentId)?.name || 'Unknown Department';

  const citations = {
    apa: `${diss.studentName} (${diss.year}). ${diss.title}. Njala University Bo Campus.`,
    mla: `${diss.studentName}. "${diss.title}." Njala University Bo Campus, ${diss.year}.`,
    chicago: `${diss.studentName}. "${diss.title}." Dissertation, Njala University Bo Campus, ${diss.year}.`
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 transition-colors font-semibold text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" style={{ color: settings.primaryColor }} />
        <span className="group-hover:opacity-80 transition-opacity" style={{ color: settings.primaryColor }}>Back to Search</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}
                >
                  Approved Research
                </span>
                <span className="px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                  {diss.year}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-stone-900 leading-tight">
                {diss.title}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-6 py-6 border-y border-stone-100">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Author</p>
                <div className="flex items-center gap-2 text-stone-900 font-bold">
                  <User className="w-4 h-4" style={{ color: settings.primaryColor }} />
                  {diss.studentName}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Supervisor</p>
                <div className="flex items-center gap-2 text-stone-900 font-bold">
                  <GraduationCap className="w-4 h-4" style={{ color: settings.primaryColor }} />
                  {diss.supervisorName}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">School</p>
                <div className="text-stone-700 text-sm font-medium">{schoolName}</div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Department</p>
                <div className="text-stone-700 text-sm font-medium">{deptName}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: settings.primaryColor }} />
                Abstract
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-wrap">
                {diss.abstract}
              </p>
            </div>

            {diss.summary && (
              <div 
                className="p-6 rounded-2xl border space-y-3"
                style={{ backgroundColor: `${settings.primaryColor}08`, borderColor: `${settings.primaryColor}20` }}
              >
                <h3 
                  className="text-sm font-bold flex items-center gap-2 uppercase tracking-widest"
                  style={{ color: settings.primaryColor }}
                >
                  <Sparkles className="w-4 h-4" />
                  AI-Generated Summary
                </h3>
                <p 
                  className="text-sm leading-relaxed italic"
                  style={{ color: `${settings.primaryColor}cc` }}
                >
                  "{diss.summary}"
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4">
              {diss.keywords?.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold">
                  #{tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Download History Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-6"
          >
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Download History
            </h3>
            <div className="h-64 w-full min-h-[256px]">
              {downloadHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart data={downloadHistory}>
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
                  No download history available yet.
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-stone-900 rounded-3xl p-8 text-white space-y-6 shadow-xl sticky top-24">
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Access Research</h3>
              <p className="text-stone-400 text-xs">Download or cite this dissertation for your research.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-white font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {downloading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
                Download PDF
              </button>
              <button
                onClick={() => setShowCitation(!showCitation)}
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700 transition-all border border-stone-700"
              >
                <Quote className="w-5 h-5" />
                Cite Research
              </button>
              <button className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-stone-800 text-white font-bold hover:bg-stone-700 transition-all border border-stone-700">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            <AnimatePresence>
              {showCitation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-stone-800 rounded-2xl p-6 space-y-4 border border-stone-700"
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">APA Style</p>
                      <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/50 p-3 rounded-lg border border-stone-700/50">{citations.apa}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">MLA Style</p>
                      <p className="text-xs text-stone-300 leading-relaxed bg-stone-900/50 p-3 rounded-lg border border-stone-700/50">{citations.mla}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopyCitation(citations.apa)}
                    className="w-full py-2 text-xs font-bold transition-colors"
                    style={{ color: copied ? '#10b981' : settings.primaryColor }}
                  >
                    {copied ? 'Copied!' : 'Copy APA Citation'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-6 border-t border-stone-800 space-y-4">
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <CheckCircle className="w-4 h-4" style={{ color: settings.primaryColor }} />
                <span>Verified by Njala University Library</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-stone-400">
                <Info className="w-4 h-4 text-blue-400" />
                <span>DOI: 10.NJALA/BO/{diss.year}/{diss.id.substring(0, 8).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DissertationDetail;
