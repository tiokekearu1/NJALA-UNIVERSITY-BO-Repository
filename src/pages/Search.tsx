import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, startAfter, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';
import { Dissertation, DissertationStatus } from '../types';
import { useAcademic } from '../components/AcademicContext';
import { YEARS } from '../constants';
import { Search as SearchIcon, Filter, SlidersHorizontal, BookOpen, User, Calendar, GraduationCap, ChevronRight, ChevronLeft, Loader2, Download, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchProps {
  onViewDetail: (dissId: string) => void;
}

const Search: React.FC<SearchProps> = ({ onViewDetail }) => {
  const { schools, departments } = useAcademic();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Dissertation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    schoolId: '',
    departmentId: '',
    year: '',
    status: 'approved' as DissertationStatus,
    studentName: '',
    supervisorName: ''
  });
  const [sortBy, setSortBy] = useState<'createdAt' | 'year' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const dissRef = collection(db, 'dissertations');
      const constraints: QueryConstraint[] = [
        where('status', '==', filters.status),
        orderBy(sortBy, sortOrder),
        limit(20)
      ];

      if (filters.schoolId) constraints.push(where('schoolId', '==', filters.schoolId));
      if (filters.departmentId) constraints.push(where('departmentId', '==', filters.departmentId));
      if (filters.year) constraints.push(where('year', '==', parseInt(filters.year)));
      if (filters.studentName) constraints.push(where('studentName', '==', filters.studentName.trim()));
      if (filters.supervisorName) constraints.push(where('supervisorName', '==', filters.supervisorName.trim()));
      
      // If searchTerm is provided, use array-contains for keywords in Firestore
      if (searchTerm) {
        constraints.push(where('keywords', 'array-contains', searchTerm.trim()));
      }

      const q = query(dissRef, ...constraints);
      const snapshot = await getDocs(q);
      
      let fetchedResults = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dissertation));
      
      setResults(fetchedResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, [filters, sortBy, sortOrder]);

  const selectedSchool = schools.find(s => s.id === filters.schoolId);
  const availableDepartments = departments.filter(d => d.schoolId === filters.schoolId);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-stone-900">Search Repository</h1>
        <p className="text-stone-500">Find research papers by title, author, programme, or keywords.</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto group">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by exact keyword (e.g. Agriculture, AI, Education)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-32 py-4 bg-white border border-stone-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none text-stone-800"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-emerald-100 text-emerald-700' : 'text-stone-400 hover:bg-stone-100'}`}
              title="Filters"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">School</label>
                <select
                  value={filters.schoolId}
                  onChange={(e) => setFilters({ ...filters, schoolId: e.target.value, departmentId: '' })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  <option value="">All Schools</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Department</label>
                <select
                  value={filters.departmentId}
                  onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                  disabled={!filters.schoolId}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm disabled:opacity-50"
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                >
                  <option value="">All Years</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Student Name</label>
                <input
                  type="text"
                  placeholder="Exact student name..."
                  value={filters.studentName}
                  onChange={(e) => setFilters({ ...filters, studentName: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Supervisor Name</label>
                <input
                  type="text"
                  placeholder="Exact supervisor name..."
                  value={filters.supervisorName}
                  onChange={(e) => setFilters({ ...filters, supervisorName: e.target.value })}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            {loading ? 'Searching...' : `Found ${results.length} results`}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-white border border-stone-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="createdAt">Recent</option>
                <option value="year">Year</option>
                <option value="title">Title</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50"
              >
                {sortOrder === 'asc' ? <ChevronRight className="w-4 h-4 rotate-[-90deg]" /> : <ChevronRight className="w-4 h-4 rotate-[90deg]" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-50 disabled:opacity-30" disabled>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg border border-stone-200 text-stone-400 hover:bg-stone-50 disabled:opacity-30" disabled>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-stone-400 font-medium tracking-widest uppercase text-xs">Loading Research...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {results.map((diss) => (
              <motion.div
                key={diss.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white border border-stone-200 rounded-2xl p-6 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onViewDetail(diss.id)}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl font-bold text-stone-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                        {diss.title}
                      </h3>
                      <span className="shrink-0 px-3 py-1 rounded-full bg-stone-100 text-stone-500 text-[10px] font-bold uppercase tracking-widest">
                        {diss.year}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm">
                      <div className="flex items-center gap-2 text-stone-600">
                        <User className="w-4 h-4 text-emerald-500" />
                        <span className="font-medium">{diss.studentName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-600">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        <span>{schools.find(s => s.id === diss.schoolId)?.name || 'Unknown School'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-stone-500 italic">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted {diss.year}</span>
                      </div>
                    </div>

                    <p className="text-stone-500 text-sm line-clamp-3 leading-relaxed">
                      {diss.abstract}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {diss.keywords?.slice(0, 5).map(tag => (
                        <span key={tag} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold uppercase tracking-wider">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="md:w-48 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-6">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onViewDetail(diss.id); }}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <a 
                      href={diss.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-bold hover:bg-stone-200 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl border-dashed">
            <div className="inline-flex p-4 rounded-full bg-stone-50 text-stone-300 mb-4">
              <SearchIcon className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-2">No dissertations found</h3>
            <p className="text-stone-400 max-w-xs mx-auto">Try adjusting your search terms or filters to find what you're looking for.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
