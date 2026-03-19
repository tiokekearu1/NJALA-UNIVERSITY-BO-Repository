import React, { useState } from 'react';
import { useSettings } from '../components/SettingsContext';
import { useAuth } from '../components/AuthContext';
import { Settings, Save, Palette, Globe, Shield, AlertTriangle, Image as ImageIcon, CheckCircle, Loader2, Plus, Trash2, ExternalLink, Layout, ChevronUp, ChevronDown, Type, MousePointer2, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HomeSection, HomeSectionType, HomeSectionItem, BackgroundConfig } from '../types';

const BackgroundPicker: React.FC<{
  config: BackgroundConfig | undefined;
  onChange: (config: BackgroundConfig) => void;
  label: string;
  primaryColor: string;
}> = ({ config, onChange, label, primaryColor }) => {
  const type = config?.type || 'solid';
  
  return (
    <div className="space-y-3 p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{label}</label>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onChange({ ...config, type: 'solid', color: config?.color || '#ffffff' })}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${type === 'solid' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
          >
            Solid
          </button>
          <button
            type="button"
            onClick={() => onChange({ 
              ...config, 
              type: 'gradient', 
              gradient: config?.gradient || { from: '#ffffff', to: primaryColor, direction: 'to bottom right' } 
            })}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${type === 'gradient' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}
          >
            Gradient
          </button>
        </div>
      </div>

      {type === 'solid' ? (
        <div className="flex gap-2">
          <input
            type="color"
            value={config?.color || '#ffffff'}
            onChange={(e) => onChange({ ...config, type: 'solid', color: e.target.value })}
            className="w-10 h-10 rounded-xl cursor-pointer border border-stone-100"
          />
          <input
            type="text"
            value={config?.color || '#ffffff'}
            onChange={(e) => onChange({ ...config, type: 'solid', color: e.target.value })}
            className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-400 uppercase">From</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config?.gradient?.from || '#ffffff'}
                  onChange={(e) => onChange({ ...config, type: 'gradient', gradient: { ...config!.gradient!, from: e.target.value } })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-stone-100"
                />
                <input
                  type="text"
                  value={config?.gradient?.from || '#ffffff'}
                  onChange={(e) => onChange({ ...config, type: 'gradient', gradient: { ...config!.gradient!, from: e.target.value } })}
                  className="flex-1 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-mono"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-stone-400 uppercase">To</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config?.gradient?.to || primaryColor}
                  onChange={(e) => onChange({ ...config, type: 'gradient', gradient: { ...config!.gradient!, to: e.target.value } })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-stone-100"
                />
                <input
                  type="text"
                  value={config?.gradient?.to || primaryColor}
                  onChange={(e) => onChange({ ...config, type: 'gradient', gradient: { ...config!.gradient!, to: e.target.value } })}
                  className="flex-1 p-1.5 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-mono"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-stone-400 uppercase">Direction</label>
            <select
              value={config?.gradient?.direction || 'to bottom right'}
              onChange={(e) => onChange({ ...config, type: 'gradient', gradient: { ...config!.gradient!, direction: e.target.value } })}
              className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-[10px]"
            >
              <option value="to bottom">To Bottom</option>
              <option value="to top">To Top</option>
              <option value="to right">To Right</option>
              <option value="to left">To Left</option>
              <option value="to bottom right">To Bottom Right</option>
              <option value="to top right">To Top Right</option>
              <option value="to bottom left">To Bottom Left</option>
              <option value="to top left">To Top Left</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

const COMMON_ICONS = [
  'BookOpen', 'GraduationCap', 'Download', 'ShieldCheck', 'Search', 'Eye', 'FileText', 'Users', 'Building2', 'Clock', 'CheckCircle', 'XCircle', 'AlertCircle', 'LayoutDashboard', 'Settings', 'TrendingUp', 'MessageSquare', 'Send', 'Check', 'X', 'RefreshCcw', 'ArrowRight'
];

const AdminSettings: React.FC = () => {
  const { profile } = useAuth();
  const { settings, updateSettings, restoreDefaults } = useSettings();
  const [formData, setFormData] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    branding: true,
    home: true,
    system: true,
    footerLinks: true,
    customPages: true,
  });

  const toggleSection = (section: string) => {
    const mainSections = ['branding', 'home', 'system', 'footerLinks', 'customPages'];
    const isMain = mainSections.includes(section);

    setCollapsedSections(prev => {
      const isCurrentlyCollapsed = prev[section] !== false;
      if (isCurrentlyCollapsed && isMain) {
        // Expand this main section, collapse other main sections
        const newState = { ...prev };
        mainSections.forEach(key => {
          newState[key] = true;
        });
        newState[section] = false;
        return newState;
      }
      // Otherwise just toggle
      return { ...prev, [section]: !isCurrentlyCollapsed };
    });
  };

  const collapseAll = () => {
    const newState: Record<string, boolean> = {};
    Object.keys(collapsedSections).forEach(key => newState[key] = true);
    ['branding', 'home', 'system', 'footerLinks', 'customPages'].forEach(key => newState[key] = true);
    setCollapsedSections(newState);
  };

  const expandAll = () => {
    const newState: Record<string, boolean> = {};
    Object.keys(collapsedSections).forEach(key => newState[key] = false);
    ['branding', 'home', 'system', 'footerLinks', 'customPages'].forEach(key => newState[key] = false);
    formData.homeSections?.forEach(s => newState[s.id] = false);
    setCollapsedSections(newState);
  };

  const addFooterLink = () => {
    const newLink = { id: Math.random().toString(36).substr(2, 9), label: '', url: '' };
    setFormData({ ...formData, footerLinks: [...(formData.footerLinks || []), newLink] });
  };

  const removeFooterLink = (id: string) => {
    setFormData({ ...formData, footerLinks: (formData.footerLinks || []).filter(l => l.id !== id) });
  };

  const updateFooterLink = (id: string, field: 'label' | 'url', value: string) => {
    setFormData({
      ...formData,
      footerLinks: (formData.footerLinks || []).map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const addHomeSection = (type: HomeSectionType) => {
    const newSection: HomeSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title: type === 'hero' ? 'New Hero Section' : type === 'features' ? 'Our Features' : 'New Section',
      order: (formData.homeSections?.length || 0),
      items: type === 'stats' || type === 'features' ? [] : undefined
    };
    setFormData({ ...formData, homeSections: [...(formData.homeSections || []), newSection] });
  };

  const removeHomeSection = (id: string) => {
    setFormData({ ...formData, homeSections: (formData.homeSections || []).filter(s => s.id !== id) });
  };

  const updateHomeSection = (id: string, updates: Partial<HomeSection>) => {
    setFormData({
      ...formData,
      homeSections: (formData.homeSections || []).map(s => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const moveHomeSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...(formData.homeSections || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // Update orders
    const updatedSections = newSections.map((s, i) => ({ ...s, order: i }));
    setFormData({ ...formData, homeSections: updatedSections });
  };

  const addSectionItem = (sectionId: string) => {
    const section = formData.homeSections?.find(s => s.id === sectionId);
    if (!section) return;

    const newItem: HomeSectionItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Item',
      description: '',
      icon: 'BookOpen'
    };

    updateHomeSection(sectionId, {
      items: [...(section.items || []), newItem]
    });
  };

  const removeSectionItem = (sectionId: string, itemId: string) => {
    const section = formData.homeSections?.find(s => s.id === sectionId);
    if (!section) return;

    updateHomeSection(sectionId, {
      items: (section.items || []).filter(i => i.id !== itemId)
    });
  };

  const updateSectionItem = (sectionId: string, itemId: string, updates: Partial<HomeSectionItem>) => {
    const section = formData.homeSections?.find(s => s.id === sectionId);
    if (!section) return;

    updateHomeSection(sectionId, {
      items: (section.items || []).map(i => i.id === itemId ? { ...i, ...updates } : i)
    });
  };

  const addCustomPage = () => {
    const newPage = { 
      id: Math.random().toString(36).substr(2, 9), 
      slug: 'new-page', 
      title: 'New Page', 
      content: '# New Page Content\n\nEdit this content using Markdown.' 
    };
    setFormData({ ...formData, customPages: [...(formData.customPages || []), newPage] });
  };

  const removeCustomPage = (id: string) => {
    setFormData({ ...formData, customPages: (formData.customPages || []).filter(p => p.id !== id) });
  };

  const updateCustomPage = (id: string, updates: Partial<any>) => {
    setFormData({
      ...formData,
      customPages: (formData.customPages || []).map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const handleRestoreDefaults = async (type: 'home' | 'all') => {
    if (!window.confirm(`Are you sure you want to restore ${type === 'home' ? 'home page' : 'all'} defaults? This cannot be undone.`)) return;
    
    setRestoring(true);
    try {
      await restoreDefaults(type);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload(); // Reload to pick up all changes
      }, 1500);
    } catch (error) {
      console.error('Error restoring defaults:', error);
    } finally {
      setRestoring(false);
    }
  };

  if (profile?.role !== 'super_admin') {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-stone-900">Access Denied</h2>
        <p className="text-stone-500">Only Super Admins can access global settings.</p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateSettings(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-stone-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-stone-600" />
            Application Settings
          </h1>
          <p className="text-stone-500">Configure global application behavior, branding, and maintenance.</p>
        </div>
        {success && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold"
            style={{ backgroundColor: `${settings.primaryColor}10`, color: settings.primaryColor, borderColor: `${settings.primaryColor}20` }}
          >
            <CheckCircle className="w-4 h-4" />
            Settings Saved
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={collapseAll}
            className="text-[10px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest"
          >
            Collapse All
          </button>
          <button
            type="button"
            onClick={expandAll}
            className="text-[10px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest"
          >
            Expand All
          </button>
        </div>

        {/* Branding Section */}
        <section className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <button 
            type="button"
            onClick={() => toggleSection('branding')}
            className="w-full p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between hover:bg-stone-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-stone-400" />
              <h2 className="font-bold text-stone-900 uppercase tracking-widest text-xs">Branding & Identity</h2>
            </div>
            {collapsedSections.branding ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronUp className="w-5 h-5 text-stone-400" />}
          </button>
          <AnimatePresence>
            {!collapsedSections.branding && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Application Name</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none text-sm"
                style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Primary Brand Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-12 p-1 bg-white border border-stone-200 rounded-xl cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none text-sm font-mono"
                  style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Logo URL (Optional)</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none text-sm"
                    style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                  />
                </div>
                {formData.logoUrl && (
                  <div className="w-12 h-12 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden">
                    <img src={formData.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>

        {/* Home Page Sections */}
        <section className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <div 
            className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-colors"
            onClick={() => toggleSection('home')}
          >
            <div className="flex items-center gap-3">
              <Layout className="w-5 h-5 text-stone-400" />
              <h2 className="font-bold text-stone-900 uppercase tracking-widest text-xs">Home Page Sections</h2>
              {collapsedSections.home ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
            </div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                onClick={() => handleRestoreDefaults('home')}
                className="text-[10px] font-bold text-red-600 hover:text-red-700 px-2 py-1 border border-red-200 rounded-lg bg-red-50 transition-colors"
              >
                Restore Home Defaults
              </button>
              <select 
                className="text-xs p-1.5 border border-stone-200 rounded-lg outline-none"
                onChange={(e) => {
                  if (e.target.value) {
                    addHomeSection(e.target.value as HomeSectionType);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">+ Add Section</option>
                <option value="hero">Hero Section</option>
                <option value="stats">Stats Section</option>
                <option value="features">Features Section</option>
                <option value="cta">CTA Section</option>
                <option value="content">Text Content</option>
              </select>
            </div>
          </div>
          <AnimatePresence>
            {!collapsedSections.home && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {(formData.homeSections || []).sort((a, b) => a.order - b.order).map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden"
                >
                  <div 
                    className="p-4 bg-white border-b border-stone-100 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => moveHomeSection(index, 'up')} disabled={index === 0} className="p-0.5 transition-colors disabled:opacity-30" style={{ color: index !== 0 ? settings.primaryColor : undefined }}><ChevronUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => moveHomeSection(index, 'down')} disabled={index === (formData.homeSections?.length || 0) - 1} className="p-0.5 transition-colors disabled:opacity-30" style={{ color: index !== (formData.homeSections?.length || 0) - 1 ? settings.primaryColor : undefined }}><ChevronDown className="w-4 h-4" /></button>
                      </div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-stone-100 px-2 py-1 rounded">
                        {section.type}
                      </span>
                      <input 
                        type="text" 
                        value={section.title || ''} 
                        onChange={(e) => updateHomeSection(section.id, { title: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Section Title"
                        className="font-bold text-stone-900 bg-transparent outline-none border-b border-transparent focus:border-stone-400"
                        style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                      />
                      {collapsedSections[section.id] ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); removeHomeSection(section.id); }} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {!collapsedSections[section.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Common Fields */}
                      <div className="space-y-4">
                        <BackgroundPicker
                          label="Section Background"
                          config={section.backgroundConfig}
                          primaryColor={formData.primaryColor}
                          onChange={(backgroundConfig) => updateHomeSection(section.id, { backgroundConfig })}
                        />
                        {(section.type === 'hero' || section.type === 'features') && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Subtitle / Description</label>
                          <textarea 
                            value={section.subtitle || ''} 
                            onChange={(e) => updateHomeSection(section.id, { subtitle: e.target.value })}
                            className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs min-h-[60px]"
                          />
                        </div>
                      )}
                      {(section.type === 'hero' || section.type === 'cta' || section.type === 'content') && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Content Text</label>
                          <textarea 
                            value={section.content || ''} 
                            onChange={(e) => updateHomeSection(section.id, { content: e.target.value })}
                            className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs min-h-[100px]"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {(section.type === 'hero' || section.type === 'cta') && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Button Text</label>
                            <input type="text" value={section.buttonText || ''} onChange={(e) => updateHomeSection(section.id, { buttonText: e.target.value })} className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Button Action (Tab ID)</label>
                            <select value={section.buttonAction || 'search'} onChange={(e) => updateHomeSection(section.id, { buttonAction: e.target.value })} className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs">
                              <option value="search">Search</option>
                              <option value="browse">Browse</option>
                              <option value="upload">Upload</option>
                            </select>
                          </div>
                        </>
                      )}
                      {section.type === 'hero' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Text Color</label>
                          <div className="flex gap-2">
                            <input type="color" value={section.textColor || '#ffffff'} onChange={(e) => updateHomeSection(section.id, { textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                            <input type="text" value={section.textColor || ''} onChange={(e) => updateHomeSection(section.id, { textColor: e.target.value })} placeholder="#ffffff" className="flex-1 p-2 bg-white border border-stone-200 rounded-lg text-xs font-mono" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Items Section (for stats and features) */}
                    {(section.type === 'stats' || section.type === 'features') && (
                      <div className="md:col-span-2 space-y-4 pt-4 border-t border-stone-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Items / Cards</label>
                          <button type="button" onClick={() => addSectionItem(section.id)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add Item
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {section.items?.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl border border-stone-200 space-y-3 relative group/item">
                              <button type="button" onClick={() => removeSectionItem(section.id, item.id)} className="absolute top-2 right-2 p-1 text-stone-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Title</label>
                                  <input type="text" value={item.title} onChange={(e) => updateSectionItem(section.id, item.id, { title: e.target.value })} className="w-full p-1.5 bg-stone-50 border border-stone-100 rounded text-[11px]" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Icon</label>
                                  <select value={item.icon} onChange={(e) => updateSectionItem(section.id, item.id, { icon: e.target.value })} className="w-full p-1.5 bg-stone-50 border border-stone-100 rounded text-[11px]">
                                    {COMMON_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                  </select>
                                </div>
                                {section.type === 'stats' ? (
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Value</label>
                                    <input type="text" value={item.value || ''} onChange={(e) => updateSectionItem(section.id, item.id, { value: e.target.value })} className="w-full p-1.5 bg-stone-50 border border-stone-100 rounded text-[11px]" />
                                  </div>
                                ) : (
                                  <div className="col-span-2 space-y-1">
                                    <label className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Description</label>
                                    <textarea value={item.description || ''} onChange={(e) => updateSectionItem(section.id, item.id, { description: e.target.value })} className="w-full p-1.5 bg-stone-50 border border-stone-100 rounded text-[11px] min-h-[40px]" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )}
</AnimatePresence>
        </section>

        {/* System Configuration */}
        <section className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <button 
            type="button"
            onClick={() => toggleSection('system')}
            className="w-full p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between hover:bg-stone-100 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-stone-400" />
              <h2 className="font-bold text-stone-900 uppercase tracking-widest text-xs">System Configuration</h2>
            </div>
            {collapsedSections.system ? <ChevronDown className="w-5 h-5 text-stone-400" /> : <ChevronUp className="w-5 h-5 text-stone-400" />}
          </button>
          <AnimatePresence>
            {!collapsedSections.system && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-900">Allow Public Uploads</p>
                        <p className="text-xs text-stone-500">Enable or disable dissertation uploads for students.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, allowPublicUploads: !formData.allowPublicUploads })}
                        className="w-14 h-8 rounded-full transition-all relative"
                        style={{ backgroundColor: formData.allowPublicUploads ? settings.primaryColor : '#d1d5db' }}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.allowPublicUploads ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-100">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-900">Restricted Access (Logged-in Only)</p>
                        <p className="text-xs text-stone-500">If enabled, only logged-in users can view approved dissertations.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, publicAccessOnly: !formData.publicAccessOnly })}
                        className="w-14 h-8 rounded-full transition-all relative"
                        style={{ backgroundColor: formData.publicAccessOnly ? settings.primaryColor : '#d1d5db' }}
                      >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.publicAccessOnly ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-red-900">Maintenance Mode</p>
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-xs text-red-700/70">Restrict access to the repository for scheduled maintenance.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, maintenanceMode: !formData.maintenanceMode })}
                className={`w-14 h-8 rounded-full transition-all relative ${formData.maintenanceMode ? 'bg-red-500' : 'bg-stone-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.maintenanceMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">Footer Copyright Text</label>
              <input
                type="text"
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 outline-none text-sm"
                style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-stone-100">
              <BackgroundPicker
                label="Footer Background"
                config={formData.footerBackgroundConfig}
                primaryColor={formData.primaryColor}
                onChange={(footerBackgroundConfig) => setFormData({ ...formData, footerBackgroundConfig })}
              />
              <div className="space-y-3 p-4 bg-white border border-stone-100 rounded-2xl shadow-sm">
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Footer Text Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.footerTextColor || '#ffffff'}
                    onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-stone-100"
                  />
                  <input
                    type="text"
                    value={formData.footerTextColor || '#ffffff'}
                    onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                    className="flex-1 p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>

        {/* Footer Links Section */}
        <section className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <div 
            className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-colors"
            onClick={() => toggleSection('footerLinks')}
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-5 h-5 text-stone-400" />
              <h2 className="font-bold text-stone-900 uppercase tracking-widest text-xs">Footer Links</h2>
              {collapsedSections.footerLinks ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addFooterLink(); }}
              className="flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Plus className="w-3 h-3" />
              Add Link
            </button>
          </div>
          <AnimatePresence>
            {!collapsedSections.footerLinks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-8 space-y-4">
            <AnimatePresence mode="popLayout">
              {(formData.footerLinks || []).map((link) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-4 items-start bg-stone-50 p-4 rounded-2xl border border-stone-100"
                >
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Label</label>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => updateFooterLink(link.id, 'label', e.target.value)}
                        placeholder="e.g. About Us"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:ring-2 outline-none text-sm"
                        style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">URL</label>
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => updateFooterLink(link.id, 'url', e.target.value)}
                        placeholder="https://..."
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:ring-2 outline-none text-sm"
                        style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFooterLink(link.id)}
                    className="mt-6 p-2 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {formData.footerLinks.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-stone-100 rounded-2xl">
                <p className="text-stone-400 text-sm">No footer links added yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>

        {/* Custom Pages Section */}
        <section className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
          <div 
            className="p-6 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between cursor-pointer hover:bg-stone-100 transition-colors"
            onClick={() => toggleSection('customPages')}
          >
            <div className="flex items-center gap-3">
              <Type className="w-5 h-5 text-stone-400" />
              <h2 className="font-bold text-stone-900 uppercase tracking-widest text-xs">Custom Pages (Footer Content)</h2>
              {collapsedSections.customPages ? <ChevronDown className="w-4 h-4 text-stone-400" /> : <ChevronUp className="w-4 h-4 text-stone-400" />}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addCustomPage(); }}
              className="flex items-center gap-2 px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Plus className="w-3 h-3" />
              Add Page
            </button>
          </div>
          <AnimatePresence>
            {!collapsedSections.customPages && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="p-8 space-y-6">
            <AnimatePresence mode="popLayout">
              {(formData.customPages || []).map((page) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Page Title</label>
                        <input
                          type="text"
                          value={page.title}
                          onChange={(e) => updateCustomPage(page.id, { title: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:ring-2 outline-none text-sm font-bold"
                          style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Slug (URL path)</label>
                        <input
                          type="text"
                          value={page.slug}
                          onChange={(e) => updateCustomPage(page.id, { slug: e.target.value })}
                          className="w-full p-2 bg-white border border-stone-200 rounded-lg focus:ring-2 outline-none text-sm font-mono"
                          style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCustomPage(page.id)}
                      className="ml-4 p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Content (Markdown)</label>
                    <textarea
                      value={page.content}
                      onChange={(e) => updateCustomPage(page.id, { content: e.target.value })}
                      className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:ring-2 outline-none text-sm font-mono min-h-[200px]"
                      style={{ '--tw-ring-color': settings.primaryColor } as React.CSSProperties}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {(!formData.customPages || formData.customPages.length === 0) && (
              <div className="text-center py-10 border-2 border-dashed border-stone-100 rounded-2xl">
                <p className="text-stone-400 text-sm">No custom pages added yet.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </section>

        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={() => handleRestoreDefaults('all')}
            className="text-stone-400 hover:text-red-600 transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Restore All Defaults
          </button>
          <button
            type="submit"
            disabled={saving || restoring}
            className="flex items-center gap-2 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 hover:brightness-110"
            style={{ backgroundColor: settings.primaryColor }}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving Changes...
              </>
            ) : restoring ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Global Settings
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
