import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Browse from './pages/Browse';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import TestManagement from './pages/TestManagement';
import TestTaking from './pages/TestTaking';
import ExamResults from './pages/ExamResults';
import DissertationDetail from './pages/DissertationDetail';
import CustomPageView from './pages/CustomPageView';
import ErrorBoundary from './components/ErrorBoundary';
import { SettingsProvider, useSettings } from './components/SettingsContext';
import { AcademicProvider } from './components/AcademicContext';
import { Loader2, GraduationCap } from 'lucide-react';

const AppContent: React.FC = () => {
  const { loading: authLoading, isAuthReady } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDissId, setSelectedDissId] = useState<string | null>(null);
  const [selectedPageSlug, setSelectedPageSlug] = useState<string | null>(null);

  if (authLoading || !isAuthReady || settingsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 space-y-6">
        <div className="relative">
          <div 
            className="w-24 h-24 border-4 rounded-full animate-spin"
            style={{ borderTopColor: settings.primaryColor, borderColor: `${settings.primaryColor}20` }}
          ></div>
          <GraduationCap 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10" 
            style={{ color: settings.primaryColor }}
          />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">NU Dissertation Repo</h2>
          <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Initializing Secure Session...</p>
        </div>
      </div>
    );
  }

  const handleViewDetail = (id: string) => {
    setSelectedDissId(id);
    setActiveTab('detail');
  };

  const handleViewPage = (slug: string) => {
    setSelectedPageSlug(slug);
    setActiveTab('page');
  };

  const handleBack = () => {
    setSelectedDissId(null);
    setSelectedPageSlug(null);
    setActiveTab('home');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} />;
      case 'search':
        return <Search onViewDetail={handleViewDetail} />;
      case 'browse':
        return <Browse onBrowse={(filters) => {
          // In a real app we would pass these to search, for now just go to search
          setActiveTab('search');
        }} />;
      case 'upload':
        return <Upload />;
      case 'dashboard':
        return <Dashboard onViewDetail={handleViewDetail} />;
      case 'tests':
        return <TestTaking />;
      case 'test-management':
        return <TestManagement />;
      case 'results':
        return <ExamResults />;
      case 'detail':
        return selectedDissId ? (
          <DissertationDetail dissId={selectedDissId} onBack={handleBack} />
        ) : (
          <Home setActiveTab={setActiveTab} />
        );
      case 'page':
        return selectedPageSlug ? (
          <CustomPageView slug={selectedPageSlug} onBack={handleBack} />
        ) : (
          <Home setActiveTab={setActiveTab} />
        );
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onNavigatePage={handleViewPage}>
      {renderContent()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <AcademicProvider>
            <AppContent />
          </AcademicProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
};

export default App;
