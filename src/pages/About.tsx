import React from 'react';
import { Users, Target, Shield, Award } from 'lucide-react';
import Logo from '../components/Logo';
import SEO from '../components/SEO';

const About: React.FC = () => {
  return (
    <div className="bg-white min-h-screen animate-fade-in">
      <SEO 
        title="About Us | KPH News" 
        description="Learn about our mission to provide accurate, unbiased political news and analysis for Kwara State. Meet the editorial team behind KPH." 
        image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&h=630&auto=format&fit=crop"
        imageAlt="KPH Editorial Team working together"
      />
      
      {/* Hero Section */}
      <div className="bg-kph-charcoal text-white py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-kph-red/20 skew-x-12 transform origin-bottom"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-20 -mb-20 blur-3xl"></div>
        
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center">
           <span className="inline-block border border-white/30 rounded-full px-4 py-1 text-xs font-bold tracking-widest uppercase mb-6 animate-slide-down">Established 2019</span>
           <h1 className="text-4xl lg:text-7xl font-bold mb-8 font-serif leading-tight animate-slide-up">
             Reporting with <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Integrity</span>
           </h1>
           <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{animationDelay: '100ms'}}>
             Kwara Political Hangout is your trusted source for political news, analysis, and commentary covering governance, elections, and public policy in Kwara State.
           </p>
        </div>
      </div>

      {/* Our Story & Values */}
      <div className="container mx-auto px-4 lg:px-8 py-20">
         {/* Our Story Section */}
         <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-3xl lg:text-5xl font-bold text-kph-charcoal mb-8 font-serif">Our Story</h2>
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
               <p>
                  Founded in 2019, Kwara Political Hangout was born out of a need for credible, in-depth political journalism in Kwara State. We recognized that citizens deserved better access to information about their government and political leaders.
               </p>
               <p>
                  Today, we have grown into a leading political media platform, known for our investigative reporting, exclusive interviews, and balanced analysis. Our team of experienced journalists and analysts work tirelessly to bring you the stories that matter.
               </p>
               <div className="pt-6">
                  <p className="text-xl font-medium text-kph-charcoal italic max-w-2xl mx-auto border-l-4 border-kph-red pl-6 md:border-l-0 md:border-t-4 md:pl-0 md:pt-6">
                     "We believe in the power of informed citizenry to drive positive change. Through our coverage, we aim to foster transparency, accountability, and active civic participation in Kwara State."
                  </p>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-kph-red shadow-sm mb-6 group-hover:bg-kph-red group-hover:text-white transition-colors">
                  <Target size={28} />
               </div>
               <h3 className="text-2xl font-bold text-kph-charcoal mb-4">Our Mission</h3>
               <p className="text-gray-600 leading-relaxed">
                 To empower the citizens of Kwara State with factual information, fostering a politically conscious society that demands accountability and good governance.
               </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-kph-red shadow-sm mb-6 group-hover:bg-kph-red group-hover:text-white transition-colors">
                  <Shield size={28} />
               </div>
               <h3 className="text-2xl font-bold text-kph-charcoal mb-4">Our Values</h3>
               <p className="text-gray-600 leading-relaxed">
                 Truth, Objectivity, and Fairness. We believe in journalism that builds bridges, not walls, and serves the public interest above all else.
               </p>
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-kph-red shadow-sm mb-6 group-hover:bg-kph-red group-hover:text-white transition-colors">
                  <Award size={28} />
               </div>
               <h3 className="text-2xl font-bold text-kph-charcoal mb-4">Our Vision</h3>
               <p className="text-gray-600 leading-relaxed">
                 To become the most trusted voice in North Central Nigeria, setting the gold standard for digital political journalism and community engagement.
               </p>
            </div>
         </div>
      </div>

      {/* Stats Section */}
      <div className="bg-kph-charcoal py-16">
         <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
               <div>
                  <div className="text-4xl lg:text-5xl font-black text-kph-red mb-2">150k+</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-gray-400">Monthly Readers</div>
               </div>
               <div>
                  <div className="text-4xl lg:text-5xl font-black text-kph-red mb-2">24/7</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-gray-400">News Cycle</div>
               </div>
               <div>
                  <div className="text-4xl lg:text-5xl font-black text-kph-red mb-2">16</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-gray-400">LGAs Covered</div>
               </div>
               <div>
                  <div className="text-4xl lg:text-5xl font-black text-kph-red mb-2">50+</div>
                  <div className="text-sm font-bold uppercase tracking-wider text-gray-400">Contributors</div>
               </div>
            </div>
         </div>
      </div>

      {/* Team Section */}
      <div className="container mx-auto px-4 lg:px-8 py-20">
         <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-kph-charcoal mb-4">Meet the Editorial Board</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">The experienced professionals guiding our coverage.</p>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
               { name: 'Dr. Adebayo Kunle', role: 'Editor-in-Chief' },
               { name: 'Sarah Johnson', role: 'Senior Pol. Editor' },
               { name: 'Musa Ibrahim', role: 'Head of Investigations' },
               { name: 'Chioma Okonkwo', role: 'Community Manager' }
            ].map((member, i) => (
               <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                  <h3 className="text-xl font-bold text-kph-charcoal mb-2">{member.name}</h3>
                  <p className="text-kph-red font-medium text-sm">{member.role}</p>
               </div>
            ))}
         </div>
      </div>
      
      {/* CTA */}
      <div className="container mx-auto px-4 lg:px-8 pb-20">
         <div className="bg-gray-100 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
                <Logo className="justify-center mb-6 scale-110" />
                <h2 className="text-3xl font-bold text-kph-charcoal mb-6">Join the Conversation</h2>
                <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                   Whether you are a policy maker, a student, or a concerned citizen, your voice matters in shaping the future of Kwara.
                </p>
                <div className="flex justify-center gap-4">
                   <a href="#/login" className="bg-kph-red text-white px-8 py-3 rounded-xl font-bold hover:bg-red-900 transition-colors shadow-lg">Write for Us</a>
                   <a href="#/contact" className="bg-white text-kph-charcoal px-8 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow border border-gray-200">Contact Us</a>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default About;