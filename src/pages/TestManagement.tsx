import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../components/AuthContext';
import { Test, Question, QuestionType } from '../types';
import { Plus, Edit2, Trash2, Eye, Save, X, FileText, Link as LinkIcon, Mic, CheckCircle, Type } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function TestManagement() {
  const { userProfile, isAdmin, isLecturer, isSchoolAdmin } = useAuth();
  const [tests, setTests] = useState<Test[]>([]);
  const [isAddingTest, setIsAddingTest] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    schoolId: userProfile?.schoolId || '',
    departmentId: userProfile?.departmentId || '',
    programmeId: userProfile?.programmeId || '',
    status: 'draft' as const
  });

  useEffect(() => {
    if (!userProfile) return;

    const q = query(collection(db, 'tests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const testsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Test));
      setTests(testsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userProfile]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    try {
      const newTest = {
        ...formData,
        createdBy: userProfile.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      const docRef = await addDoc(collection(db, 'tests'), newTest);
      setIsAddingTest(false);
      setFormData({
        title: '',
        description: '',
        duration: 60,
        schoolId: userProfile?.schoolId || '',
        departmentId: userProfile?.departmentId || '',
        programmeId: userProfile?.programmeId || '',
        status: 'draft'
      });
    } catch (error) {
      console.error('Error creating test:', error);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await deleteDoc(doc(db, 'tests', id));
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const handleEditTest = async (test: Test) => {
    setEditingTest(test);
    // Fetch questions for this test
    const q = query(collection(db, `tests/${test.id}/questions`), orderBy('order', 'asc'));
    onSnapshot(q, (snapshot) => {
      const questionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
      setEditingQuestions(questionsData);
    });
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: '', // Temporary
      testId: editingTest!.id,
      type: 'typing',
      prompt: '',
      order: editingQuestions.length + 1,
      points: 5
    };
    setEditingQuestions([...editingQuestions, newQuestion]);
  };

  const handleSaveQuestions = async () => {
    if (!editingTest) return;
    try {
      for (const q of editingQuestions) {
        if (q.id) {
          await updateDoc(doc(db, `tests/${editingTest.id}/questions`, q.id), { ...q });
        } else {
          const { id, ...rest } = q;
          await addDoc(collection(db, `tests/${editingTest.id}/questions`), rest);
        }
      }
      alert('Questions saved successfully!');
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const newQuestions = [...editingQuestions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setEditingQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = editingQuestions.filter((_, i) => i !== index);
    setEditingQuestions(newQuestions);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test Management</h1>
          <p className="text-gray-500">Create and manage academic tests and exams</p>
        </div>
        <button
          onClick={() => setIsAddingTest(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Create New Test
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <motion.div
            key={test.id}
            layoutId={test.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                test.status === 'published' ? 'bg-green-100 text-green-700' : 
                test.status === 'draft' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {test.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{test.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <span>{test.duration} mins</span>
              <span>•</span>
              <span>{test.programmeId}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditTest(test)}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDeleteTest(test.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Test Modal */}
      <AnimatePresence>
        {isAddingTest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-bold">Create New Test</h2>
                <button onClick={() => setIsAddingTest(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleCreateTest} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mt-4"
                >
                  Create Test
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Questions Modal */}
      <AnimatePresence>
        {editingTest && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Edit Questions: {editingTest.title}</h2>
                  <p className="text-sm text-gray-500">Add and configure questions for this test</p>
                </div>
                <button onClick={() => setEditingTest(null)}><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {editingQuestions.map((q, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-6 border border-gray-200 relative group">
                    <button
                      onClick={() => removeQuestion(index)}
                      className="absolute top-4 right-4 p-2 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Prompt</label>
                        <textarea
                          value={q.prompt}
                          onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20 bg-white"
                          placeholder="Enter the question text..."
                        />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={q.type}
                            onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          >
                            <option value="typing">Text Input</option>
                            <option value="yes_no">Yes / No</option>
                            <option value="file">File Upload</option>
                            <option value="audio">Audio Upload</option>
                            <option value="link">Link Submission</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) => updateQuestion(index, { points: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={handleAddQuestion}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Question
                </button>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-4">
                <button
                  onClick={() => setEditingTest(null)}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestions}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
