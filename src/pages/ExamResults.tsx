import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Submission, ExamResult, Test } from '../types';
import { Trophy, FileText, CheckCircle, AlertCircle, Search, Filter, Download, Eye, Send, X, Star, Award, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ExamResults() {
  const { userProfile, isAdmin, isLecturer, isSchoolAdmin, isStudent } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [publishingResult, setPublishingResult] = useState<Submission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [publishData, setPublishData] = useState({
    score: 0,
    grade: 'A',
    comments: ''
  });

  useEffect(() => {
    if (!userProfile) return;

    // Fetch tests for context
    const testsQuery = query(collection(db, 'tests'));
    onSnapshot(testsQuery, (snapshot) => {
      setTests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test)));
    });

    // Fetch submissions
    let submissionsQuery;
    if (isAdmin() || isLecturer() || isSchoolAdmin()) {
      submissionsQuery = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'));
    } else {
      submissionsQuery = query(collection(db, 'submissions'), where('studentId', '==', userProfile.uid), orderBy('submittedAt', 'desc'));
    }

    const unsubSubmissions = onSnapshot(submissionsQuery, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
    });

    // Fetch results
    let resultsQuery;
    if (isAdmin() || isLecturer() || isSchoolAdmin()) {
      resultsQuery = query(collection(db, 'exam_results'), orderBy('publishedAt', 'desc'));
    } else {
      resultsQuery = query(collection(db, 'exam_results'), where('studentId', '==', userProfile.uid), orderBy('publishedAt', 'desc'));
    }

    const unsubResults = onSnapshot(resultsQuery, (snapshot) => {
      setResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult)));
      setLoading(false);
    });

    return () => {
      unsubSubmissions();
      unsubResults();
    };
  }, [userProfile]);

  const handlePublishResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingResult || !userProfile) return;

    try {
      const test = tests.find(t => t.id === publishingResult.testId);
      const result: Omit<ExamResult, 'id'> = {
        studentId: publishingResult.studentId,
        studentName: publishingResult.studentName,
        registrationNumber: '', // Should be fetched from student profile
        testId: publishingResult.testId,
        testTitle: test?.title || 'Unknown Test',
        score: publishData.score,
        grade: publishData.grade,
        comments: publishData.comments,
        publishedAt: Timestamp.now(),
        publishedBy: userProfile.uid
      };

      await addDoc(collection(db, 'exam_results'), result);
      await updateDoc(doc(db, 'submissions', publishingResult.id), { status: 'graded', score: publishData.score });
      
      setPublishingResult(null);
      setPublishData({ score: 0, grade: 'A', comments: '' });
      alert('Result published successfully!');
    } catch (error) {
      console.error('Error publishing result:', error);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade[0]) {
      case 'A': return 'text-green-600 bg-green-50';
      case 'B': return 'text-blue-600 bg-blue-50';
      case 'C': return 'text-yellow-600 bg-yellow-50';
      case 'D': return 'text-orange-600 bg-orange-50';
      default: return 'text-red-600 bg-red-50';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-gray-500">View and manage student performance and final grades</p>
        </div>
      </div>

      {/* Tabs / Sections */}
      <div className="space-y-12">
        {/* Published Results Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Award className="text-indigo-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-900">Published Final Results</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group"
              >
                <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-2xl font-bold text-xl ${getGradeColor(result.grade)}`}>
                  {result.grade}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{result.studentName}</h3>
                    <p className="text-xs text-gray-500">Published {result.publishedAt.toDate().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Test:</span>
                    <span className="font-medium text-gray-900">{result.testTitle}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Score:</span>
                    <span className="font-bold text-indigo-600">{result.score}%</span>
                  </div>
                  {result.comments && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                      "{result.comments}"
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {results.length === 0 && (
              <div className="col-span-full py-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No published results yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Submissions Section (Admin/Lecturer Only) */}
        {(isAdmin() || isLecturer() || isSchoolAdmin()) && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <FileText className="text-indigo-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-900">Recent Submissions</h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Test</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Submitted At</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{sub.studentName}</div>
                        <div className="text-xs text-gray-500">{sub.studentId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tests.find(t => t.id === sub.testId)?.title || 'Unknown Test'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {sub.submittedAt.toDate().toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          sub.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setViewingSubmission(sub)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View Submission"
                          >
                            <Eye size={18} />
                          </button>
                          {sub.status === 'pending' && (
                            <button
                              onClick={() => setPublishingResult(sub)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Grade & Publish"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* View Submission Modal */}
      <AnimatePresence>
        {viewingSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Submission Details: {viewingSubmission.studentName}</h2>
                <button onClick={() => setViewingSubmission(null)}><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {viewingSubmission.answers.map((ans, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wider">Question {idx + 1}</p>
                    <div className="space-y-4">
                      {ans.value && <p className="text-gray-900 text-lg">{ans.value}</p>}
                      {ans.link && (
                        <a href={ans.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                          <Download size={16} />
                          View External Link
                        </a>
                      )}
                      {ans.fileUrl && (
                        <a href={ans.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <FileText size={20} className="text-indigo-600" />
                          <span className="text-sm font-medium text-gray-700">Download Submitted File</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Publish Result Modal */}
      <AnimatePresence>
        {publishingResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Grade & Publish Result</h2>
                <button onClick={() => setPublishingResult(null)}><X size={24} /></button>
              </div>
              <form onSubmit={handlePublishResult} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Score (%)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      max="100"
                      value={publishData.score}
                      onChange={(e) => setPublishData({ ...publishData, score: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      value={publishData.grade}
                      onChange={(e) => setPublishData({ ...publishData, grade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                  <textarea
                    value={publishData.comments}
                    onChange={(e) => setPublishData({ ...publishData, comments: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                    placeholder="Enter feedback for the student..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mt-4 flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Publish Final Result
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
