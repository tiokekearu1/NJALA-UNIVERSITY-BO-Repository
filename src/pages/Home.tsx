import React from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../components/SettingsContext';
import { HomeSection } from '../types';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { settings } = useSettings();
  const sections = settings.homeSections || [];

  const getIcon = (name: string) => {
    const Icon = (Icons as any)[name];
    return Icon || Icons.HelpCircle;
  };

  const renderSection = (section: HomeSection) => {
    const bgStyle = section.backgroundConfig?.type === 'gradient' 
      ? { backgroundImage: `linear-gradient(${section.backgroundConfig.gradient?.direction}, ${section.backgroundConfig.gradient?.from}, ${section.backgroundConfig.gradient?.to})` }
      : { backgroundColor: section.backgroundConfig?.color || '#ffffff' };

    switch (section.type) {
      case 'hero':
        return (
          <section 
            key={section.id}
            className="relative py-12 md:py-24 overflow-hidden rounded-3xl shadow-2xl mx-4"
            style={{ ...bgStyle, color: section.textColor || '#ffffff' }}
          >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.2)_0%,_transparent_50%)]"></div>
            <div className="relative max-w-4xl mx-auto text-center px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {section.subtitle && (
                  <span className="inline-block px-4 py-1.5 rounded-full bg-black/20 text-white/80 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-6 border border-white/10">
                    {section.subtitle}
                  </span>
                )}
                <h1 className="text-3xl md:text-6xl font-bold mb-6 leading-tight">
                  {section.title}
                </h1>
                <p className="text-base md:text-xl opacity-80 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                  {section.content}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {section.buttonText && (
                    <button
                      onClick={() => setActiveTab(section.buttonAction || 'search')}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-stone-900 px-8 py-4 rounded-xl font-bold hover:bg-stone-50 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <Icons.Search className="w-5 h-5" />
                      {section.buttonText}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black/20 text-white px-8 py-4 rounded-xl font-bold hover:bg-black/30 transition-all border border-white/10 active:scale-95"
                  >
                    Browse Schools
                    <Icons.ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </div>
          </section>
        );

      case 'stats':
        return (
          <section key={section.id} className="w-full px-4 py-10" style={bgStyle}>
            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {section.items?.map((stat, index) => {
                const Icon = getIcon(stat.icon || 'BookOpen');
                return (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-6 md:p-8 rounded-2xl bg-white border border-stone-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
                      style={{ backgroundColor: settings.primaryColor }}
                    ></div>
                    <div 
                      className="inline-flex p-3 rounded-xl bg-stone-50 mb-4 transition-all duration-300 group-hover:scale-110"
                      style={{ color: settings.primaryColor }}
                    >
                      <Icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <p className="text-2xl md:text-4xl font-bold text-stone-900 mb-1">{stat.value}</p>
                    <p className="text-[10px] md:text-xs font-semibold text-stone-400 uppercase tracking-widest">{stat.title}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );

      case 'features':
        return (
          <section key={section.id} className="w-full px-4 py-16 md:py-24" style={bgStyle}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 md:mb-20">
                <h2 className="text-2xl md:text-4xl font-bold text-stone-900 mb-4">{section.title}</h2>
                <p className="text-stone-500 max-w-2xl mx-auto text-sm md:text-base px-4">
                  {section.subtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                {section.items?.map((feature, index) => {
                  const Icon = getIcon(feature.icon || 'FileText');
                  return (
                    <motion.div
                      key={feature.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="relative group p-6 md:p-0"
                    >
                      <div 
                        className="absolute -inset-4 md:-inset-6 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-500"
                        style={{ backgroundColor: `${settings.primaryColor}08` }}
                      ></div>
                      <div className="relative">
                        <div 
                          className="inline-flex p-4 rounded-2xl mb-6 group-hover:rotate-6 transition-transform duration-500"
                          style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}
                        >
                          <Icon className="w-8 h-8 md:w-10 md:h-10" />
                        </div>
                        <h3 className="text-lg md:text-xl font-bold text-stone-900 mb-3">{feature.title}</h3>
                        <p className="text-stone-500 leading-relaxed text-sm md:text-base">
                          {feature.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={section.id} className="w-full px-4 py-10">
            <div 
              className="max-w-5xl mx-auto rounded-3xl p-8 md:p-16 text-center text-white relative overflow-hidden shadow-2xl"
              style={bgStyle}
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
              <div className="relative">
                <h2 className="text-2xl md:text-4xl font-bold mb-6">{section.title}</h2>
                <p className="text-white/70 mb-10 max-w-xl mx-auto text-sm md:text-lg">
                  {section.content}
                </p>
                <button
                  onClick={() => setActiveTab(section.buttonAction || 'upload')}
                  className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95 hover:brightness-110"
                  style={{ backgroundColor: settings.primaryColor, color: '#ffffff' }}
                >
                  {section.buttonText}
                </button>
              </div>
            </div>
          </section>
        );

      case 'content':
        return (
          <section key={section.id} className="w-full px-4 py-12 md:py-20" style={bgStyle}>
            <div className="max-w-4xl mx-auto">
              {section.title && <h2 className="text-2xl md:text-4xl font-bold text-stone-900 mb-8 text-center">{section.title}</h2>}
              <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed text-sm md:text-lg px-4">
                {section.content}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {sections.sort((a, b) => a.order - b.order).map(renderSection)}
    </div>
  );
};

export default Home;
