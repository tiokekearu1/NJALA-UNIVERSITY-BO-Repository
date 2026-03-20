import React, { useState } from 'react';
import { useAcademic } from './AcademicContext';
import { useSettings } from './SettingsContext';
import { School, Department, Programme } from '../types';
import { Building2, GraduationCap, BookOpen, Plus, Edit2, Trash2, ChevronRight, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const AcademicManagement: React.FC = () => {
  const { settings } = useSettings();
  const { 
    schools, departments, programmes, loading,
    addSchool, updateSchool, deleteSchool,
    addDepartment, updateDepartment, deleteDepartment,
    addProgramme, updateProgramme, deleteProgramme
  } = useAcademic();

  const [activeTab, setActiveTab] = useState<'schools' | 'departments' | 'programmes'>('schools');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', parentId: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        name: item.name, 
        parentId: activeTab === 'departments' ? item.schoolId : activeTab === 'programmes' ? item.departmentId : '' 
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', parentId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeTab === 'schools') {
        if (editingItem) await updateSchool(editingItem.id, formData.name);
        else await addSchool(formData.name);
      } else if (activeTab === 'departments') {
        if (editingItem) await updateDepartment(editingItem.id, formData.name, formData.parentId);
        else await addDepartment(formData.name, formData.parentId);
      } else if (activeTab === 'programmes') {
        if (editingItem) await updateProgramme(editingItem.id, formData.name, formData.parentId);
        else await addProgramme(formData.name, formData.parentId);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsSubmitting(true);
    try {
      if (activeTab === 'schools') await deleteSchool(itemToDelete);
      else if (activeTab === 'departments') await deleteDepartment(itemToDelete);
      else if (activeTab === 'programmes') await deleteProgramme(itemToDelete);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: settings.primaryColor }} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Building2 className="w-6 h-6" style={{ color: settings.primaryColor }} />
            Academic Structure Management
          </h3>
          <p className="text-sm text-stone-500">Configure schools, departments, and academic programmes.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-3 text-white rounded-2xl font-bold shadow-lg transition-all hover:brightness-110"
          style={{ backgroundColor: settings.primaryColor, boxShadow: `0 10px 15px -3px ${settings.primaryColor}33` }}
        >
          <Plus className="w-5 h-5" />
          Add New {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border border-stone-200 rounded-2xl p-1 shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('schools')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'schools' ? 'text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
          style={activeTab === 'schools' ? { backgroundColor: settings.primaryColor } : {}}
        >
          <Building2 className="w-4 h-4" />
          Schools
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'departments' ? 'text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
          style={activeTab === 'departments' ? { backgroundColor: settings.primaryColor } : {}}
        >
          <GraduationCap className="w-4 h-4" />
          Departments
        </button>
        <button
          onClick={() => setActiveTab('programmes')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'programmes' ? 'text-white shadow-md' : 'text-stone-500 hover:bg-stone-50'}`}
          style={activeTab === 'programmes' ? { backgroundColor: settings.primaryColor } : {}}
        >
          <BookOpen className="w-4 h-4" />
          Programmes
        </button>
      </div>

      {/* List */}
      <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Name</th>
                {activeTab !== 'schools' && (
                  <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                    {activeTab === 'departments' ? 'School' : 'Department'}
                  </th>
                )}
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {activeTab === 'schools' && schools.map((school) => (
                <tr key={school.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-stone-900">{school.name}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(school)} 
                      className="p-2 text-stone-400 rounded-lg transition-all group"
                    >
                      <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: settings.primaryColor }} />
                    </button>
                    <button onClick={() => handleDeleteClick(school.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {activeTab === 'departments' && departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-stone-900">{dept.name}</td>
                  <td className="px-6 py-4 text-xs text-stone-500">
                    {schools.find(s => s.id === dept.schoolId)?.name || 'Unknown School'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(dept)} 
                      className="p-2 text-stone-400 rounded-lg transition-all group"
                    >
                      <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: settings.primaryColor }} />
                    </button>
                    <button onClick={() => handleDeleteClick(dept.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {activeTab === 'programmes' && programmes.map((prog) => (
                <tr key={prog.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-stone-900">{prog.name}</td>
                  <td className="px-6 py-4 text-xs text-stone-500">
                    {departments.find(d => d.id === prog.departmentId)?.name || 'Unknown Department'}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => handleOpenModal(prog)} 
                      className="p-2 text-stone-400 rounded-lg transition-all group"
                    >
                      <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" style={{ color: settings.primaryColor }} />
                    </button>
                    <button onClick={() => handleDeleteClick(prog.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-900">
                  {editingItem ? 'Edit' : 'Add'} {activeTab.slice(0, -1)}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-stone-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none transition-all"
                    style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                    placeholder={`Enter ${activeTab.slice(0, -1)} name`}
                  />
                </div>

                {activeTab !== 'schools' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      {activeTab === 'departments' ? 'Select School' : 'Select Department'}
                    </label>
                      <select
                        required
                        value={formData.parentId}
                        onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none transition-all"
                        style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                      >
                      <option value="">Select {activeTab === 'departments' ? 'School' : 'Department'}</option>
                      {activeTab === 'departments' ? (
                        schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                      ) : (
                        departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)
                      )}
                    </select>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:brightness-110"
                    style={{ backgroundColor: settings.primaryColor, boxShadow: `0 10px 15px -3px ${settings.primaryColor}33` }}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-stone-900">Confirm Delete</h3>
                  <p className="text-sm text-stone-500">
                    Are you sure you want to delete this {activeTab.slice(0, -1)}? This action cannot be undone and may affect associated records.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setItemToDelete(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-600 font-bold rounded-xl hover:bg-stone-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AcademicManagement;
