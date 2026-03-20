import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { BookOpen, Search, Upload, LayoutDashboard, LogIn, LogOut, Menu, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LoginModal from './LoginModal';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNavigatePage?: (slug: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onNavigatePage }) => {
  const { user, profile, logout } = useAuth();
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleFooterLinkClick = (url: string) => {
    if (url.startsWith('/page/')) {
      const slug = url.replace('/page/', '');
      onNavigatePage?.(slug);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: BookOpen },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'browse', label: 'Browse', icon: Menu },
    ...(user ? [{ id: 'upload', label: 'Upload', icon: Upload }] : []),
    ...(user ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2 font-bold text-xl tracking-tight"
                style={{ color: settings.primaryColor }}
              >
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <BookOpen className="w-8 h-8" />
                )}
                <span className="hidden sm:inline">{settings.appName}</span>
                <span className="sm:hidden">NUDR</span>
              </button>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id 
                      ? '' 
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                  style={{
                    ...(activeTab === item.id ? { backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor } : {}),
                    '--hover-color': settings.primaryColor
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.color = settings.primaryColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== item.id) {
                      e.currentTarget.style.color = '';
                    }
                  }}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              
              <div className="ml-4 pl-4 border-l border-stone-200 flex items-center gap-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden lg:block">
                      <p className="text-xs font-semibold text-stone-900">{profile?.displayName}</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">{profile?.role.replace('_', ' ')}</p>
                    </div>
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-stone-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}
                      >
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <button
                      onClick={logout}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm hover:shadow-md"
                    style={{ backgroundColor: settings.primaryColor }}
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-stone-600 hover:bg-stone-100 transition-colors"
                style={{ '--hover-color': settings.primaryColor } as any}
                onMouseEnter={(e) => e.currentTarget.style.color = settings.primaryColor}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-stone-200 overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      activeTab === item.id 
                        ? '' 
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                    style={{
                      ...(activeTab === item.id ? { backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor } : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.color = settings.primaryColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== item.id) {
                        e.currentTarget.style.color = '';
                      }
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
                {!user && (
                  <button
                    onClick={() => {
                      setIsLoginModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium transition-colors"
                    style={{ color: settings.primaryColor }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${settings.primaryColor}10`}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </button>
                )}
                {user && (
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer 
        className="py-16 border-t border-stone-800 mt-auto"
        style={{ 
          backgroundColor: settings.footerBackgroundConfig?.type === 'gradient' 
            ? `linear-gradient(${settings.footerBackgroundConfig.gradient?.direction}, ${settings.footerBackgroundConfig.gradient?.from}, ${settings.footerBackgroundConfig.gradient?.to})`
            : settings.footerBackgroundConfig?.color,
          color: settings.footerTextColor,
          borderColor: 'rgba(255,255,255,0.1)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 text-white font-bold text-xl mb-6">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <BookOpen className="w-8 h-8" style={{ color: settings.primaryColor }} />
                )}
                <span style={{ color: '#fff' }}>{settings.appName}</span>
              </div>
              <p className="text-sm leading-relaxed max-w-md" style={{ color: settings.footerTextColor }}>
                Centralized digital repository for academic excellence. Preserving and providing access to the intellectual output of Njala University.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6" style={{ color: '#fff' }}>Navigation</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => setActiveTab('home')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => setActiveTab('search')} className="hover:text-white transition-colors">Search Dissertations</button></li>
                <li><button onClick={() => setActiveTab('browse')} className="hover:text-white transition-colors">Browse by School</button></li>
                {user && <li><button onClick={() => setActiveTab('upload')} className="hover:text-white transition-colors">Upload Dissertation</button></li>}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6" style={{ color: '#fff' }}>Quick Links</h4>
              <ul className="space-y-3 text-sm">
                {(settings.footerLinks || []).map((link) => (
                  <li key={link.id}>
                    <button 
                      onClick={() => handleFooterLinkClick(link.url)}
                      className="hover:text-white transition-colors flex items-center gap-2"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-[0.2em]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div style={{ color: settings.footerTextColor }}>
              {settings.footerText}
            </div>
            <div className="flex gap-6">
              <button onClick={() => onNavigatePage?.('privacy')} className="hover:text-white transition-colors">Privacy Policy</button>
              <button onClick={() => onNavigatePage?.('terms')} className="hover:text-white transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
