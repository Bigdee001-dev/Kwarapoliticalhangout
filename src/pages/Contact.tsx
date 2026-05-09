import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { AdminService } from '../services/adminService';
import SEO from '../components/SEO';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    // Simulate API delay
    setTimeout(() => {
      AdminService.addMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        body: formData.message
      });
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    }, 1500);
  };

  return (
    <div className="bg-kph-light min-h-screen animate-fade-in">
       <SEO 
         title="Contact Us | KPH News" 
         description="Get in touch with the KPH team for inquiries, press releases, or advertising opportunities." 
         image="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&h=630&auto=format&fit=crop"
         imageAlt="Contact KPH News Team"
       />

       <div className="bg-kph-charcoal text-white py-16 lg:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
             <h1 className="text-4xl lg:text-6xl font-bold mb-4 animate-slide-up">Contact Us</h1>
             <p className="text-gray-300 text-lg max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '100ms'}}>
                Have a story tip, a question, or interested in advertising? We'd love to hear from you.
             </p>
          </div>
       </div>

       <div className="container mx-auto px-4 lg:px-8 py-16 -mt-10 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
             
             {/* Form */}
             <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-xl border border-gray-100 animate-slide-up" style={{animationDelay: '200ms'}}>
                <h2 className="text-2xl font-bold text-kph-charcoal mb-6 flex items-center">
                    Send a Message <span className="w-12 h-[2px] bg-gray-200 ml-4"></span>
                </h2>
                
                {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                     <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle size={32} />
                     </div>
                     <h3 className="text-xl font-bold text-kph-charcoal mb-2">Message Sent!</h3>
                     <p className="text-gray-500 mb-6">Thank you for reaching out. We will get back to you shortly.</p>
                     <button 
                        onClick={() => setStatus('idle')}
                        className="text-kph-red font-bold hover:underline"
                     >
                        Send another message
                     </button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="group">
                            <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-kph-red transition-colors">Full Name</label>
                            <input 
                              type="text" 
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-kph-red focus:ring-4 focus:ring-red-50 transition-all duration-300 bg-gray-50 focus:bg-white" 
                              placeholder="John Doe" 
                              required
                            />
                         </div>
                         <div className="group">
                            <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-kph-red transition-colors">Email Address</label>
                            <input 
                              type="email" 
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-kph-red focus:ring-4 focus:ring-red-50 transition-all duration-300 bg-gray-50 focus:bg-white" 
                              placeholder="john@example.com" 
                              required
                            />
                         </div>
                     </div>
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-kph-red transition-colors">Subject</label>
                        <div className="relative">
                            <select 
                              name="subject"
                              value={formData.subject}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-kph-red focus:ring-4 focus:ring-red-50 transition-all duration-300 bg-gray-50 focus:bg-white appearance-none cursor-pointer"
                            >
                                <option>General Inquiry</option>
                                <option>Press Release Submission</option>
                                <option>Advertising Opportunities</option>
                                <option>Report an Error</option>
                            </select>
                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
                                <ArrowRight size={16} className="rotate-90" />
                            </div>
                        </div>
                     </div>
                     <div className="group">
                        <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-kph-red transition-colors">Message</label>
                        <textarea 
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          rows={5} 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-kph-red focus:ring-4 focus:ring-red-50 transition-all duration-300 bg-gray-50 focus:bg-white resize-none" 
                          placeholder="How can we help you today?"
                          required
                        ></textarea>
                     </div>
                     <button 
                       type="submit" 
                       disabled={status === 'submitting'}
                       className="w-full bg-kph-red text-white font-bold py-4 rounded-lg hover:bg-red-900 transition-all duration-300 shadow-lg shadow-red-200 flex items-center justify-center transform hover:-translate-y-1 group disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                        {status === 'submitting' ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <>
                            <Send size={18} className="mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Send Message
                          </>
                        )}
                     </button>
                  </form>
                )}
             </div>

             {/* Info */}
             <div className="space-y-8 animate-slide-up" style={{animationDelay: '300ms'}}>
                <div className="bg-white p-8 lg:p-10 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-bold text-kph-charcoal mb-8">Contact Information</h2>
                    <div className="space-y-8">
                        <div className="flex items-start group">
                            <div className="bg-red-50 p-4 rounded-2xl mr-5 text-kph-red group-hover:bg-kph-red group-hover:text-white transition-colors duration-300 shadow-sm">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Office Address</h4>
                                <p className="text-gray-500 leading-relaxed">123 Unity Road, GRA,<br/>Ilorin, Kwara State, Nigeria</p>
                            </div>
                        </div>
                        <div className="flex items-start group">
                            <div className="bg-red-50 p-4 rounded-2xl mr-5 text-kph-red group-hover:bg-kph-red group-hover:text-white transition-colors duration-300 shadow-sm">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Email Us</h4>
                                <a href="mailto:Kphofficial21@gmail.com" className="text-gray-500 hover:text-kph-red block transition-colors">Kphofficial21@gmail.com</a>
                            </div>
                        </div>
                        <div className="flex items-start group">
                            <div className="bg-red-50 p-4 rounded-2xl mr-5 text-kph-red group-hover:bg-kph-red group-hover:text-white transition-colors duration-300 shadow-sm">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-1">Call Us</h4>
                                <a href="tel:09019547831" className="text-gray-500 text-lg font-medium hover:text-kph-red">09019547831</a>
                                <p className="text-xs text-kph-red font-bold uppercase tracking-wider mt-1 bg-red-50 inline-block px-2 py-1 rounded">Mon-Fri, 9am - 5pm</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="bg-gray-200 h-64 rounded-2xl flex items-center justify-center text-gray-400 font-bold border-4 border-white shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/map/800/400')] bg-cover bg-center opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700"></div>
                    <div className="relative z-10 bg-white/80 backdrop-blur-sm px-6 py-2 rounded-full shadow-sm">
                        View on Google Maps
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default Contact;