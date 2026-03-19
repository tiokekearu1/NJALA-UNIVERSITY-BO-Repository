import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useAcademic } from '../components/AcademicContext';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { YEARS } from '../constants';
import { summarizeAbstract } from '../services/geminiService';
import { Upload as UploadIcon, FileText, CheckCircle, Loader2, AlertCircle, Trash2, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Upload: React.FC = () => {
  const { user, profile } = useAuth();
  const { schools, departments } = useAcademic();
  const [file, setFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    studentName: profile?.displayName || '',
    registrationNumber: '',
    schoolId: '',
    departmentId: '',
    programmeId: '',
    supervisorName: '',
    year: new Date().getFullYear(),
    abstract: '',
    keywords: '',
  });

  const availableDepartments = departments.filter(d => d.schoolId === formData.schoolId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please upload a PDF or DOCX file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploadingFile(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 1. Upload File with progress simulation (since uploadBytes doesn't give progress easily without resumable)
      const fileRef = ref(storage, `dissertations/${user.uid}/${Date.now()}_${file.name}`);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 200);

      const uploadResult = await uploadBytes(fileRef, file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      const fileUrl = await getDownloadURL(uploadResult.ref);
      setIsUploadingFile(false);

      // 2. AI Summarization
      setIsSummarizing(true);
      const summary = await summarizeAbstract(formData.abstract);
      setIsSummarizing(false);

      // 3. Save Metadata to Firestore
      const dissertationData = {
        ...formData,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k !== ''),
        fileUrl,
        status: 'pending',
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        summary,
        downloadCount: 0,
      };

      await addDoc(collection(db, 'dissertations'), dissertationData);
      setSuccess(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'dissertations');
      setError('Failed to upload dissertation. Please try again.');
    } finally {
      setIsUploadingFile(false);
      setIsSummarizing(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center py-20 space-y-8 bg-white border border-stone-200 rounded-3xl shadow-xl"
      >
        <div className="inline-flex p-6 rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle className="w-16 h-16" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-stone-900">Upload Successful!</h2>
          <p className="text-stone-500 max-w-md mx-auto">
            Your dissertation has been submitted for review. You can track the approval status in your dashboard.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
        >
          Upload Another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-stone-900">Submit Dissertation</h1>
        <p className="text-stone-500">Provide the required metadata and upload your softcopy for archival.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-10">
          {/* File Upload Area */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Dissertation File (PDF or DOCX)</label>
            {!file ? (
              <div className="relative group">
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-stone-200 rounded-2xl p-12 text-center group-hover:border-emerald-400 group-hover:bg-emerald-50 transition-all">
                  <div className="inline-flex p-4 rounded-full bg-stone-50 text-stone-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all mb-4">
                    <UploadIcon className="w-8 h-8" />
                  </div>
                  <p className="text-stone-900 font-bold mb-1">Click to upload or drag and drop</p>
                  <p className="text-stone-400 text-sm">PDF or DOCX (Max 20MB)</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-600 text-white">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-emerald-900 font-bold text-sm">{file.name}</p>
                    <p className="text-emerald-600 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Metadata Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Dissertation Title</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter the full title of your dissertation"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Student Name</label>
                <input
                  required
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Registration Number</label>
                <input
                  required
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  placeholder="e.g. 2024/NJ/BO/..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Supervisor Name</label>
                <input
                  required
                  type="text"
                  value={formData.supervisorName}
                  onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                  placeholder="Dr./Prof. Full Name"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">School</label>
                <select
                  required
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value, departmentId: '' })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  <option value="">Select School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Department</label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  disabled={!formData.schoolId}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm disabled:opacity-50"
                >
                  <option value="">Select Department</option>
                  {availableDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Year of Submission</label>
                <select
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Keywords (Comma separated)</label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  placeholder="e.g. Health, Biostatistics, Sierra Leone"
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Abstract</label>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                <Sparkles className="w-3 h-3" />
                AI Summary Enabled
              </div>
            </div>
            <textarea
              required
              rows={8}
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              placeholder="Paste your dissertation abstract here..."
              className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none leading-relaxed"
            />
          </div>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className="bg-stone-50 p-8 border-t border-stone-100 flex flex-col gap-6">
          {(isUploadingFile || isSummarizing) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-stone-500">
                  {isUploadingFile ? 'Uploading Dissertation File...' : 'Generating AI Abstract Summary...'}
                </span>
                <span className="text-emerald-600">
                  {isUploadingFile ? `${uploadProgress}%` : 'Processing...'}
                </span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isUploadingFile ? `${uploadProgress}%` : '100%' }}
                  className={`h-full ${isSummarizing ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`}
                />
              </div>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                {isUploadingFile ? 'Securely transmitting your research to our servers.' : 'Our AI is analyzing your abstract for better discoverability.'}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-stone-400 max-w-md">
              By clicking submit, you confirm that this is your original work and you grant Njala University permission to archive it.
            </div>
            <button
              type="submit"
              disabled={isUploadingFile || isSummarizing || !file}
              className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploadingFile || isSummarizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Dissertation
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Upload;
