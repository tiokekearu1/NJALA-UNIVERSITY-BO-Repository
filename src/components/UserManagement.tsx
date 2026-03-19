import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { UserProfile, UserRole, School, Department } from '../types';
import { useAcademic } from './AcademicContext';
import { useAuth } from './AuthContext';
import { Users, Shield, Building2, GraduationCap, Search, Edit2, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

const UserManagement: React.FC = () => {
  const { profile: currentUserProfile } = useAuth();
  const { schools, departments } = useAcademic();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user.uid);
    setEditForm({
      role: user.role,
      schoolId: user.schoolId,
      departmentId: user.departmentId
    });
  };

  const handleSave = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...editForm,
        updatedAt: Timestamp.now()
      });
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles: { value: UserRole; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'school_admin', label: 'School Admin' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">User Management</h2>
          <p className="text-sm text-stone-500">Manage user roles and academic affiliations</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-bottom border-stone-100">
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Affiliation</th>
                <th className="px-6 py-4 text-[10px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-stone-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-stone-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                          <Users className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-stone-900">{user.displayName}</p>
                        <p className="text-xs text-stone-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.uid ? (
                      <div className="space-y-3 min-w-[200px]">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Role</label>
                          <select
                            value={editForm.role}
                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                            className="text-sm bg-white border border-stone-200 rounded-lg px-2 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            {roles.map(role => (
                              <option key={role.value} value={role.value}>{role.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">School</label>
                          <select
                            value={editForm.schoolId || ''}
                            onChange={(e) => setEditForm({ ...editForm, schoolId: e.target.value || undefined, departmentId: undefined })}
                            className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1.5 w-full"
                          >
                            <option value="">No School</option>
                            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>

                        {editForm.schoolId && (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Department</label>
                            <select
                              value={editForm.departmentId || ''}
                              onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value || undefined })}
                              className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1.5 w-full"
                            >
                              <option value="">No Department</option>
                              {departments.filter(d => d.schoolId === editForm.schoolId).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'school_admin' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'lecturer' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser !== user.uid && (
                      <div className="space-y-1">
                        {user.schoolId ? (
                          <div className="flex items-center gap-1.5 text-xs text-stone-600">
                            <Building2 className="w-3 h-3" />
                            {schools.find(s => s.id === user.schoolId)?.name}
                          </div>
                        ) : (
                          <span className="text-xs text-stone-400 italic">No affiliation</span>
                        )}
                        {user.departmentId && (
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-400 ml-4">
                            <GraduationCap className="w-3 h-3" />
                            {departments.find(d => d.id === user.departmentId)?.name}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUser === user.uid ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSave(user.uid)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="p-2 text-stone-400 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(user)}
                        disabled={user.uid === currentUserProfile?.uid}
                        className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
