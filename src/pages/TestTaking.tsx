import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, Timestamp, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../components/AuthContext';
import { Test, Question, Submission, Answer } from '../types';
import { Clock, FileText, CheckCircle, AlertCircle, Upload, Link as LinkIcon, Mic, Type, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TestTaking() {
  const { userProfile } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!userProfile) return;

    // Fetch published tests for the student's programme
    const q = query(
      collection(db, 'tests'),
      where('status', '==', 'published'),
      where('programmeId', '==', userProfile.programmeId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
      setTests(testsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0 && !submitted) {
      timer = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const startTest = async (test: Test) => {
    setActiveTest(test);
    setLoading(true);
    
    // Fetch questions
    const q = query(collection(db, `tests/${test.id}/questions`), orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
    setQuestions(questionsData);
    
    setTimeLeft(test.duration * 60);
    setLoading(false);
  };

  const handleAnswerChange = (questionId: string, updates: Partial<Answer>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { questionId, ...prev[questionId], ...updates }
    }));
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    if (!userProfile) return;
    try {
      const storageRef = ref(storage, `test_submissions/${activeTest?.id}/${userProfile.uid}/${questionId}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      handleAnswerChange(questionId, { fileUrl: url, value: file.name });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSubmit = async () => {
    if (!activeTest || !userProfile || submitting) return;
    
    setSubmitting(true);
    try {
      const submission: Omit<Submission, 'id'> = {
        testId: activeTest.id,
        studentId: userProfile.uid,
        studentName: userProfile.displayName,
        answers: Object.values(answers),
        submittedAt: Timestamp.now(),
        status: 'pending'
      };
      
      await addDoc(collection(db, 'submissions'), submission);
      setSubmitted(true);
      setActiveTest(null);
    } catch (error) {
      console.error('Error submitting test:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  if (submitted) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Test Submitted!</h2>
          <p className="text-gray-600 mb-8">Your responses have been recorded. Your lecturer will grade your submission soon.</p>
          <button
            onClick={() => setSubmitted(false)}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  if (activeTest) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 flex justify-between items-center sticky top-6 z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{activeTest.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock size={14} />
                <span className={timeLeft && timeLeft < 300 ? 'text-red-500 font-bold animate-pulse' : ''}>
                  Time Remaining: {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <div className="w-32 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button
                onClick={() => { if(window.confirm('Are you sure you want to submit?')) handleSubmit(); }}
                disabled={submitting}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                Submit
              </button>
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 min-h-[400px] flex flex-col"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 text-indigo-600 mb-4">
                  {currentQuestion?.type === 'typing' && <Type size={20} />}
                  {currentQuestion?.type === 'yes_no' && <CheckCircle size={20} />}
                  {currentQuestion?.type === 'file' && <Upload size={20} />}
                  {currentQuestion?.type === 'audio' && <Mic size={20} />}
                  {currentQuestion?.type === 'link' && <LinkIcon size={20} />}
                  <span className="text-sm font-bold uppercase tracking-wider">{currentQuestion?.type.replace('_', ' ')}</span>
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-900 mb-8 leading-relaxed">
                  {currentQuestion?.prompt}
                </h3>

                {/* Answer Inputs */}
                <div className="space-y-6">
                  {currentQuestion?.type === 'typing' && (
                    <textarea
                      value={answers[currentQuestion.id]?.value || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, { value: e.target.value })}
                      className="w-full p-6 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none h-48 transition-colors text-lg"
                      placeholder="Type your answer here..."
                    />
                  )}

                  {currentQuestion?.type === 'yes_no' && (
                    <div className="flex gap-4">
                      {['Yes', 'No'].map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswerChange(currentQuestion.id, { value: option })}
                          className={`flex-1 py-6 rounded-2xl border-2 font-bold text-xl transition-all ${
                            answers[currentQuestion.id]?.value === option
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200'
                              : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}

                  {(currentQuestion?.type === 'file' || currentQuestion?.type === 'audio') && (
                    <div className="space-y-4">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-400">{currentQuestion.type === 'audio' ? 'MP3, WAV, M4A' : 'PDF, DOCX, ZIP'}</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept={currentQuestion.type === 'audio' ? 'audio/*' : '*/*'}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(currentQuestion.id, e.target.files[0])}
                        />
                      </label>
                      {answers[currentQuestion.id]?.fileUrl && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Uploaded: {answers[currentQuestion.id]?.value}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {currentQuestion?.type === 'link' && (
                    <div className="space-y-4">
                      <div className="relative">
                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="url"
                          value={answers[currentQuestion.id]?.link || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion.id, { link: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-colors"
                          placeholder="https://example.com/your-link"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-12 pt-8 border-t border-gray-100">
                <button
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                  Previous
                </button>
                <button
                  disabled={currentQuestionIndex === questions.length - 1}
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-30"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Academic Tests</h1>
        <p className="text-gray-500">View and take your scheduled tests and exams</p>
      </div>

      {tests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tests Available</h3>
          <p className="text-gray-500">There are currently no published tests for your programme.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{test.title}</h3>
              <p className="text-gray-600 text-sm mb-6 line-clamp-2">{test.description}</p>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock size={16} />
                  <span>{test.duration} mins</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <FileText size={16} />
                  <span>Exam</span>
                </div>
              </div>
              <button
                onClick={() => startTest(test)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Start Test
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
