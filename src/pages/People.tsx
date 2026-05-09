
import React, { useState, useEffect } from 'react';
import { Search, Linkedin, Twitter, ExternalLink, X, MapPin, Calendar, Users, Loader2, Award, Briefcase, GraduationCap, Mic2, HeartHandshake, Globe } from 'lucide-react';
import { PeopleService } from '../services/peopleService';
import SEO from '../components/SEO';

const CATEGORIES = [
  'All Profiles',
  'Political Icons',
  'Techpreneurs',
  'Business Moguls',
  'Academic Legends',
  'Youth Voices',
  'Women Making Waves',
  'Cultural Ambassadors',
  'Faith Leaders',
  'Diaspora Champions',
  'Sports Stars',
  'Civil Society',
  'Media Personalities'
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Political Icons': return <Award size={14} />;
    case 'Techpreneurs': return <Zap size={14} />;
    case 'Business Moguls': return <Briefcase size={14} />;
    case 'Academic Legends': return <GraduationCap size={14} />;
    case 'Youth Voices': return <Users size={14} />;
    case 'Cultural Ambassadors': return <Globe size={14} />;
    case 'Faith Leaders': return <Award size={14} />;
    case 'Media Personalities': return <Mic2 size={14} />;
    case 'Civil Society': return <HeartHandshake size={14} />;
    default: return <Award size={14} />;
  }
};

const Zap = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const People: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Profiles');
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeople = async () => {
      setLoading(true);
      const data = await PeopleService.getAllPeople();
      setPeople(data);
      setLoading(false);
    };
    fetchPeople();
  }, []);

  const filteredProfiles = people.filter(p => 
    (activeFilter === 'All Profiles' || p.subCategory === activeFilter) &&
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openProfile = (profile: any) => {
    setSelectedProfile(profile);
  };

  useEffect(() => {
    if (selectedProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProfile]);

  const closeProfile = () => {
    setSelectedProfile(null);
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen animate-fade-in relative pb-20">
      <SEO title="Council of Eminence | KPH News" description="The definitive directory of Kwara's most influential figures, thinkers, and leaders." />

      {/* Hero Section */}
      <div className="relative pt-24 pb-32 overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-kph-red/20 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-kph-red/10 blur-[120px] rounded-full" />
        </div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mb-6 animate-slide-up">
              <Award size={14} className="text-kph-red" /> The Definitive Directory
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 font-serif tracking-tight animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Council of <span className="text-kph-red italic">Eminence</span>
            </h1>
            <p className="text-zinc-400 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed animate-slide-up font-medium" style={{ animationDelay: '0.2s' }}>
              Curating the profiles of Kwara's most influential changemakers, leaders, and pioneers.
            </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="container mx-auto px-4 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-100 flex flex-col lg:flex-row gap-6 items-center">
            <div className="relative w-full lg:w-1/3">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input 
                  type="text" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  placeholder="Search names or titles..." 
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-kph-red/10 focus:border-kph-red transition-all font-bold text-kph-charcoal placeholder:text-zinc-400" 
                />
            </div>
            <div className="flex gap-2 w-full lg:flex-1 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar scrollbar-hide">
                {CATEGORIES.map((filter) => (
                    <button 
                      key={filter} 
                      onClick={() => setActiveFilter(filter)} 
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                        activeFilter === filter 
                        ? 'bg-kph-red text-white shadow-lg shadow-kph-red/20 scale-105' 
                        : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                      }`}
                    >
                      {filter}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="container mx-auto px-4 lg:px-8 py-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-zinc-100 rounded-full animate-pulse" />
              <div className="absolute inset-0 border-4 border-t-kph-red rounded-full animate-spin" />
            </div>
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Convening the Council...</p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="bg-white p-24 rounded-[3rem] border-2 border-dashed border-zinc-100 text-center flex flex-col items-center justify-center animate-fade-in shadow-sm">
             <div className="w-24 h-24 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-300 mb-8 rotate-12">
                <Users size={48} />
             </div>
             <h3 className="text-3xl font-bold text-kph-charcoal mb-3">No Eminence Found</h3>
             <p className="text-zinc-500 max-w-md mx-auto leading-relaxed font-medium italic">
               We are currently vetting new entries for this category. Check back soon for updates to the directory.
             </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProfiles.map((profile, idx) => (
                  <div 
                    key={profile.id} 
                    className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] transition-all duration-700 border border-zinc-100 group flex flex-col hover:-translate-y-2"
                  >
                      <div className="h-96 overflow-hidden relative">
                          <img 
                            src={profile.photoUrl} 
                            alt={profile.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale-[0.5] group-hover:grayscale-0" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                          
                          <div className="absolute top-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                             <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white p-2 rounded-xl">
                               <ExternalLink size={18} />
                             </div>
                          </div>

                          <div className="absolute bottom-6 left-6 right-6">
                            <span className="inline-flex items-center gap-1.5 bg-kph-red text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xl mb-3">
                              {getCategoryIcon(profile.subCategory)}
                              {profile.subCategory}
                            </span>
                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-kph-red transition-colors duration-300">{profile.name}</h3>
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{profile.title}</p>
                          </div>
                      </div>
                      <div className="p-8 flex flex-col flex-1 bg-white">
                          <div className="flex items-center gap-2 mb-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <MapPin size={12} className="text-kph-red" /> {profile.state} State
                          </div>
                          <p className="text-zinc-500 text-sm line-clamp-3 mb-8 leading-relaxed italic font-medium">
                            "{profile.bio}"
                          </p>
                          <button 
                            onClick={() => openProfile(profile)} 
                            className="mt-auto group/btn relative overflow-hidden bg-zinc-950 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] transition-all hover:shadow-2xl hover:shadow-zinc-950/20 active:scale-[0.98]"
                          >
                            <span className="relative z-10">Explore Legacy</span>
                            <div className="absolute inset-0 bg-kph-red translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                          </button>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8">
            <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-fade-in" onClick={closeProfile} />
            
            <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden relative z-10 animate-slide-up shadow-2xl flex flex-col lg:flex-row border border-white/10">
                
                {/* Close Button */}
                <button 
                  onClick={closeProfile} 
                  className="absolute top-6 right-6 z-30 bg-white/10 hover:bg-kph-red text-white p-3 rounded-2xl transition-all duration-300 hover:rotate-90 shadow-xl border border-white/20"
                >
                  <X size={20} />
                </button>

                {/* Left: Visual */}
                <div className="w-full lg:w-[45%] h-80 lg:h-auto relative overflow-hidden group">
                    <img 
                      src={selectedProfile.photoUrl} 
                      alt={selectedProfile.name} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-40" />
                    
                    <div className="absolute bottom-10 left-10 p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hidden lg:block">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-kph-red flex items-center justify-center shadow-lg">
                          <Award size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Profile Status</p>
                          <p className="text-xs font-bold">Verified Eminent</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Community Reach</p>
                          <p className="text-xs font-bold">High Influence</p>
                        </div>
                      </div>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="w-full lg:w-[55%] p-8 lg:p-16 bg-white overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="flex flex-wrap items-center gap-3 mb-8">
                      <span className="inline-flex items-center gap-2 bg-zinc-100 text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-zinc-200">
                        <MapPin size={12} className="text-kph-red" /> {selectedProfile.state} State
                      </span>
                      <span className="inline-flex items-center gap-2 bg-kph-red/10 text-kph-red text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-kph-red/20">
                        {getCategoryIcon(selectedProfile.subCategory)} {selectedProfile.subCategory}
                      </span>
                    </div>

                    <h2 className="text-5xl lg:text-6xl font-bold text-zinc-900 mb-3 font-serif tracking-tight leading-tight">
                      {selectedProfile.name}
                    </h2>
                    <h3 className="text-2xl text-zinc-400 font-medium mb-10 leading-relaxed italic border-l-4 border-kph-red pl-6">
                      {selectedProfile.title}
                    </h3>

                    <div className="relative mb-12">
                      <div className="prose prose-lg prose-zinc text-zinc-600 leading-relaxed max-w-none whitespace-pre-wrap font-medium">
                        {selectedProfile.bio}
                      </div>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-kph-red border border-zinc-100 transition-transform group-hover:scale-110 group-hover:rotate-6">
                            <Globe size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Birthplace</p>
                            <p className="text-sm font-bold text-zinc-900">{selectedProfile.birthplace || selectedProfile.state}</p>
                          </div>
                        </div>
                        <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 flex items-center gap-5 group hover:bg-white hover:shadow-xl transition-all duration-500">
                          <div className="w-14 h-14 bg-white shadow-sm rounded-2xl flex items-center justify-center text-kph-red border border-zinc-100 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                            <Calendar size={24} />
                          </div>
                          <div>
                            <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mb-1">Listing Date</p>
                            <p className="text-sm font-bold text-zinc-900">May 2026</p>
                          </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex flex-col sm:flex-row gap-4">
                      <button className="flex-1 bg-zinc-950 text-white py-5 rounded-2xl font-bold uppercase text-[11px] tracking-[0.2em] hover:bg-kph-red transition-all duration-500 shadow-2xl shadow-zinc-950/20 active:scale-[0.98]">
                        Download Intelligence Report
                      </button>
                      <div className="flex gap-4">
                        {selectedProfile.socialLinks?.twitter && (
                          <a href={selectedProfile.socialLinks.twitter} target="_blank" rel="noreferrer" className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-2xl flex items-center justify-center hover:bg-sky-500 hover:text-white hover:rotate-12 transition-all duration-300 border border-zinc-200">
                            <Twitter size={22} />
                          </a>
                        )}
                        {selectedProfile.socialLinks?.linkedin && (
                          <a href={selectedProfile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="w-16 h-16 bg-zinc-100 text-zinc-600 rounded-2xl flex items-center justify-center hover:bg-sky-700 hover:text-white hover:-rotate-12 transition-all duration-300 border border-zinc-200">
                            <Linkedin size={22} />
                          </a>
                        )}
                      </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default People;
