import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube, Shield, Instagram } from 'lucide-react';
import { NAV_ITEMS } from '../data';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-kph-charcoal text-white pt-12 pb-6">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Col */}
          <div>
            <div className="mb-6">
              <Logo variant="light" />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Politics, Media and People. Providing comprehensive, accurate, and timely political news analysis for Kwara State.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/share/16WfzEJG78/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded hover:bg-kph-red transition"><Facebook size={16} /></a>
              <a href="https://www.instagram.com/kwarapoliticalhangout?igsh=aG10ejRrM213bDZu" target="_blank" rel="noopener noreferrer" className="bg-white/10 p-2 rounded hover:bg-kph-red transition"><Instagram size={16} /></a>
              <a href="#" className="bg-white/10 p-2 rounded hover:bg-kph-red transition"><Twitter size={16} /></a>
              <a href="#" className="bg-white/10 p-2 rounded hover:bg-kph-red transition"><Linkedin size={16} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-gray-600 pb-2 inline-block">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map(item => (
                <li key={item.path}>
                  <Link to={item.path} className="text-gray-300 hover:text-kph-red text-sm transition">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li><Link to="/login" className="text-gray-300 hover:text-kph-red text-sm transition font-semibold text-kph-accent">Writer Portal</Link></li>
              <li><Link to="#" className="text-gray-300 hover:text-kph-red text-sm transition">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4 border-b border-gray-600 pb-2 inline-block">Contact Info</h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start space-x-3">
                <MapPin size={18} className="text-kph-red mt-1 shrink-0" />
                <span>123 Unity Road, GRA, Ilorin,<br />Kwara State, Nigeria</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail size={18} className="text-kph-red shrink-0" />
                <a href="mailto:Kphofficial21@gmail.com" className="hover:text-white">Kphofficial21@gmail.com</a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={18} className="text-kph-red shrink-0" />
                <a href="tel:09019547831" className="hover:text-white">09019547831</a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Kwara Political Hangout. All rights reserved.</p>

          <Link to="/admin" className="flex items-center gap-2 hover:text-white transition-colors opacity-50 hover:opacity-100">
            <Shield size={12} /> Admin
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;