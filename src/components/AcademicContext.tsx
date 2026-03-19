import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { School, Department, Programme, AuditLog } from '../types';
import { ACADEMIC_STRUCTURE } from '../constants';
import { useAuth } from './AuthContext';

interface AcademicContextType {
  schools: School[];
  departments: Department[];
  programmes: Programme[];
  loading: boolean;
  addSchool: (name: string) => Promise<void>;
  updateSchool: (id: string, name: string) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  addDepartment: (name: string, schoolId: string) => Promise<void>;
  updateDepartment: (id: string, name: string, schoolId: string) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  addProgramme: (name: string, departmentId: string) => Promise<void>;
  updateProgramme: (id: string, name: string, departmentId: string) => Promise<void>;
  deleteProgramme: (id: string) => Promise<void>;
}

const AcademicContext = createContext<AcademicContextType | undefined>(undefined);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSchools = onSnapshot(query(collection(db, 'schools'), orderBy('name')), 
      (snapshot) => {
        setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School)));
      },
      (error) => {
        console.error('Schools snapshot error:', error);
      }
    );

    const unsubDepts = onSnapshot(query(collection(db, 'departments'), orderBy('name')), 
      (snapshot) => {
        setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
      },
      (error) => {
        console.error('Departments snapshot error:', error);
      }
    );

    const unsubProgs = onSnapshot(query(collection(db, 'programmes'), orderBy('name')), 
      (snapshot) => {
        setProgrammes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Programme)));
        setLoading(false);
      },
      (error) => {
        console.error('Programmes snapshot error:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubSchools();
      unsubDepts();
      unsubProgs();
    };
  }, []);

  // Seeding logic
  useEffect(() => {
    const seedIfEmpty = async () => {
      const schoolSnap = await getDocs(collection(db, 'schools'));
      if (schoolSnap.empty) {
        console.log('Seeding academic structure...');
        const batch = writeBatch(db);
        
        for (const schoolData of ACADEMIC_STRUCTURE.schools) {
          const schoolRef = doc(collection(db, 'schools'));
          batch.set(schoolRef, { name: schoolData.name });
          
          for (const deptData of schoolData.departments) {
            const deptRef = doc(collection(db, 'departments'));
            batch.set(deptRef, { name: deptData.name, schoolId: schoolRef.id });
          }
        }
        
        await batch.commit();
        console.log('Seeding complete.');
      }
    };
    
    seedIfEmpty();
  }, []);

  const logAction = async (action: 'CREATE' | 'UPDATE' | 'DELETE', resourceType: 'academic_structure', resourceId: string, details: any) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        userId: user.uid,
        userEmail: user.email,
        action,
        resourceId,
        resourceType,
        details,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const addSchool = async (name: string) => {
    const docRef = await addDoc(collection(db, 'schools'), { name });
    await logAction('CREATE', 'academic_structure', docRef.id, { type: 'school', name });
  };

  const updateSchool = async (id: string, name: string) => {
    await updateDoc(doc(db, 'schools', id), { name });
    await logAction('UPDATE', 'academic_structure', id, { type: 'school', name });
  };

  const deleteSchool = async (id: string) => {
    await deleteDoc(doc(db, 'schools', id));
    await logAction('DELETE', 'academic_structure', id, { type: 'school' });
  };

  const addDepartment = async (name: string, schoolId: string) => {
    const docRef = await addDoc(collection(db, 'departments'), { name, schoolId });
    await logAction('CREATE', 'academic_structure', docRef.id, { type: 'department', name, schoolId });
  };

  const updateDepartment = async (id: string, name: string, schoolId: string) => {
    await updateDoc(doc(db, 'departments', id), { name, schoolId });
    await logAction('UPDATE', 'academic_structure', id, { type: 'department', name, schoolId });
  };

  const deleteDepartment = async (id: string) => {
    await deleteDoc(doc(db, 'departments', id));
    await logAction('DELETE', 'academic_structure', id, { type: 'department' });
  };

  const addProgramme = async (name: string, departmentId: string) => {
    const docRef = await addDoc(collection(db, 'programmes'), { name, departmentId });
    await logAction('CREATE', 'academic_structure', docRef.id, { type: 'programme', name, departmentId });
  };

  const updateProgramme = async (id: string, name: string, departmentId: string) => {
    await updateDoc(doc(db, 'programmes', id), { name, departmentId });
    await logAction('UPDATE', 'academic_structure', id, { type: 'programme', name, departmentId });
  };

  const deleteProgramme = async (id: string) => {
    await deleteDoc(doc(db, 'programmes', id));
    await logAction('DELETE', 'academic_structure', id, { type: 'programme' });
  };

  return (
    <AcademicContext.Provider value={{
      schools, departments, programmes, loading,
      addSchool, updateSchool, deleteSchool,
      addDepartment, updateDepartment, deleteDepartment,
      addProgramme, updateProgramme, deleteProgramme
    }}>
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const context = useContext(AcademicContext);
  if (context === undefined) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
};
