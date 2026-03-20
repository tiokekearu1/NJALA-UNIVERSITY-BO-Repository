import React, { useState } from 'react';
import { useAcademic } from '../components/AcademicContext';
import { useSettings } from '../components/SettingsContext';
import { ChevronRight, GraduationCap, Building2, BookOpen, ArrowRight, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BrowseProps {
  onBrowse: (filters: { schoolId?: string; departmentId?: string }) => void;
}

const Browse: React.FC<BrowseProps> = ({ onBrowse }) => {
  const { settings } = useSettings();
  const { schools, departments } = useAcademic();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const selectedSchool = schools.find(s => s.id === selectedSchoolId);
  const schoolDepartments = departments.filter(d => d.schoolId === selectedSchoolId);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-stone-900">Browse by Academic Structure</h1>
        <p className="text-stone-500">Explore research papers organized by School, Department, and Programme.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Schools List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">Schools</h2>
          <div className="space-y-2">
            {schools.map((school) => (
              <button
                key={school.id}
                onClick={() => setSelectedSchoolId(school.id)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group"
                style={{ 
                  backgroundColor: selectedSchoolId === school.id ? settings.primaryColor : 'white',
                  borderColor: selectedSchoolId === school.id ? settings.primaryColor : '#f5f5f4',
                  color: selectedSchoolId === school.id ? 'white' : '#44403c',
                  boxShadow: selectedSchoolId === school.id ? `0 10px 15px -3px ${settings.primaryColor}30` : 'none'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="p-2 rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: selectedSchoolId === school.id ? 'rgba(255,255,255,0.2)' : '#f5f5f4'
                    }}
                  >
                    <Building2 
                      className="w-5 h-5" 
                      style={{ color: selectedSchoolId === school.id ? 'white' : settings.primaryColor }}
                    />
                  </div>
                  <span className="font-bold text-sm leading-tight">{school.name}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${
                  selectedSchoolId === school.id ? 'translate-x-1' : 'text-stone-300 group-hover:translate-x-1'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* Departments & Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedSchool ? (
              <motion.div
                key={selectedSchool.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white border border-stone-200 rounded-3xl p-8 shadow-sm space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-stone-900">{selectedSchool.name}</h2>
                    <p className="text-stone-500 text-sm">Select a department to view dissertations</p>
                  </div>
                  <button
                    onClick={() => onBrowse({ schoolId: selectedSchool.id })}
                    className="flex items-center gap-2 font-bold text-sm transition-colors hover:brightness-110"
                    style={{ color: settings.primaryColor }}
                  >
                    View All in School
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schoolDepartments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => onBrowse({ schoolId: selectedSchool.id, departmentId: dept.id })}
                      className="flex flex-col items-start p-6 rounded-2xl border border-stone-100 bg-stone-50 hover:bg-white hover:shadow-md transition-all group text-left"
                      style={{ '--hover-border': settings.primaryColor } as any}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div 
                          className="p-2 rounded-xl bg-white transition-all shadow-sm group-hover:text-white"
                          style={{ color: settings.primaryColor }}
                        >
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-stone-800 transition-colors leading-tight group-hover:text-stone-900">
                          {dept.name}
                        </h3>
                      </div>
                      <div 
                        className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors"
                        style={{ color: '#a8a29e' }} // Default stone-400
                      >
                        <span>Browse Research</span>
                        <Search className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-8 border-t border-stone-100">
                  <div 
                    className="flex items-center gap-4 p-6 rounded-2xl border"
                    style={{ backgroundColor: `${settings.primaryColor}10`, borderColor: `${settings.primaryColor}20` }}
                  >
                    <div 
                      className="p-3 rounded-full"
                      style={{ backgroundColor: `${settings.primaryColor}20`, color: settings.primaryColor }}
                    >
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold" style={{ color: settings.primaryColor }}>Academic Excellence</h4>
                      <p className="text-sm leading-relaxed opacity-80" style={{ color: settings.primaryColor }}>
                        Explore thousands of verified research papers from {selectedSchool.name}.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-white border border-stone-200 rounded-3xl border-dashed text-center space-y-4">
                <div className="p-6 rounded-full bg-stone-50 text-stone-200">
                  <Building2 className="w-16 h-16" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-stone-900">Select a School</h3>
                  <p className="text-stone-400 max-w-xs mx-auto">Choose a school from the list on the left to explore its departments and research papers.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Browse;
