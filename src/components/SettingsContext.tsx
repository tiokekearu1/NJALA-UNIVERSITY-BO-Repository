import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  restoreDefaults: (type: 'home' | 'all') => Promise<void>;
  loading: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Njala University Bo Campus Dissertation Repository',
  primaryColor: '#059669', // emerald-600
  allowPublicUploads: true,
  maintenanceMode: false,
  footerText: '© ' + new Date().getFullYear() + ' Njala University. All Rights Reserved.',
  footerBackgroundConfig: { type: 'solid', color: '#1c1917' },
  footerTextColor: '#a8a29e',
  publicAccessOnly: false,
  footerLinks: [
    { id: '1', label: 'About Njala', url: '/page/about' },
    { id: '2', label: 'Library Services', url: '/page/library' },
    { id: '3', label: 'Contact Us', url: 'mailto:library@njala.edu.sl' },
    { id: '4', label: 'Privacy Policy', url: '/page/privacy' },
    { id: '5', label: 'Terms of Service', url: '/page/terms' }
  ],
  customPages: [
    {
      id: 'about',
      slug: 'about',
      title: 'About Njala University Bo Campus',
      content: '# About Njala University\n\nNjala University is a public university in Sierra Leone. It is the second largest university in the country and is located in Njala and Bo.\n\n## Our Mission\nTo provide high-quality education and research that contributes to the sustainable development of Sierra Leone and the wider world.'
    },
    {
      id: 'library',
      slug: 'library',
      title: 'Library Services',
      content: '# Library Services\n\nThe Njala University Library provides a wide range of resources and services to support the research and learning needs of our students and faculty.\n\n## Digital Repository\nThis dissertation repository is a key part of our digital strategy, ensuring that academic research is preserved and accessible.'
    },
    {
      id: 'privacy',
      slug: 'privacy',
      title: 'Privacy Policy',
      content: '# Privacy Policy\n\nWe are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you use the Njala University Dissertation Repository.'
    },
    {
      id: 'terms',
      slug: 'terms',
      title: 'Terms of Service',
      content: '# Terms of Service\n\nBy using the Njala University Dissertation Repository, you agree to comply with these terms of service. All content is for academic and research purposes only.'
    }
  ],
  homeSections: [
    {
      id: 'hero',
      type: 'hero',
      title: 'Njala University Bo Campus',
      subtitle: 'Official University Repository',
      content: 'Empowering students and researchers with a modern digital platform for academic excellence and knowledge preservation.',
      backgroundConfig: { type: 'solid', color: '#064e3b' },
      textColor: '#ffffff',
      buttonText: 'Search Repository',
      buttonAction: 'search',
      order: 0
    },
    {
      id: 'stats',
      type: 'stats',
      items: [
        { id: 's1', title: 'Dissertations', value: '2,450+', icon: 'BookOpen', color: 'text-emerald-600' },
        { id: 's2', title: 'Researchers', value: '1,200+', icon: 'GraduationCap', color: 'text-blue-600' },
        { id: 's3', title: 'Downloads', value: '15,000+', icon: 'Download', color: 'text-purple-600' },
        { id: 's4', title: 'Verified', value: '100%', icon: 'ShieldCheck', color: 'text-amber-600' },
      ],
      order: 1
    },
    {
      id: 'features',
      type: 'features',
      title: 'Modern Digital Standards',
      subtitle: 'Built to meet international academic repository standards similar to MIT Libraries and Harvard DASH.',
      items: [
        {
          id: 'f1',
          title: 'Centralized Repository',
          description: 'A single platform for all dissertations from Njala University Bo Campus, organized by School and Department.',
          icon: 'FileText',
        },
        {
          id: 'f2',
          title: 'Advanced Search',
          description: 'Powerful search engine to find research by student name, title, programme, supervisor, or keywords.',
          icon: 'Search',
        },
        {
          id: 'f3',
          title: 'Preview & Download',
          description: 'Preview dissertation abstracts and summaries online before downloading the full softcopy.',
          icon: 'Eye',
        },
      ],
      order: 2
    },
    {
      id: 'cta',
      type: 'cta',
      title: 'Ready to contribute your research?',
      content: 'Join thousands of students who have already preserved their academic legacy in the Njala University digital repository.',
      backgroundConfig: { type: 'solid', color: '#1c1917' },
      buttonText: 'Upload Dissertation',
      buttonAction: 'upload',
      order: 3
    }
  ]
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'global');
    
    const unsubscribe = onSnapshot(settingsRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snapshot.data() } as AppSettings);
        } else {
          // Initialize with defaults if not exists
          setDoc(settingsRef, DEFAULT_SETTINGS);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Settings snapshot error:', error);
        // Even if it fails, we should stop loading and use defaults
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const settingsRef = doc(db, 'settings', 'global');
    await setDoc(settingsRef, { ...settings, ...newSettings }, { merge: true });
  };

  const restoreDefaults = async (type: 'home' | 'all') => {
    const settingsRef = doc(db, 'settings', 'global');
    if (type === 'home') {
      await setDoc(settingsRef, { ...settings, homeSections: DEFAULT_SETTINGS.homeSections }, { merge: true });
    } else {
      await setDoc(settingsRef, DEFAULT_SETTINGS);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, restoreDefaults, loading }}>
      <div style={{ '--primary-color': settings.primaryColor } as React.CSSProperties}>
        {children}
      </div>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
