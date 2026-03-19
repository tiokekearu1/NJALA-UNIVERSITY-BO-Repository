import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSettings } from '../components/SettingsContext';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

interface CustomPageViewProps {
  slug: string;
  onBack: () => void;
}

const CustomPageView: React.FC<CustomPageViewProps> = ({ slug, onBack }) => {
  const { settings } = useSettings();
  const page = settings.customPages?.find(p => p.slug === slug);

  if (!page) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-stone-900">Page Not Found</h2>
        <p className="text-stone-500">The page you are looking for does not exist.</p>
        <button 
          onClick={onBack}
          className="mt-6 text-emerald-600 font-bold hover:underline flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12"
    >
      <button 
        onClick={onBack}
        className="mb-8 text-stone-500 hover:text-stone-900 transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-8 md:p-12">
          <h1 className="text-3xl md:text-5xl font-bold text-stone-900 mb-8">{page.title}</h1>
          <div className="prose prose-stone max-w-none prose-headings:text-stone-900 prose-p:text-stone-600 prose-a:text-emerald-600">
            <ReactMarkdown>{page.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomPageView;
