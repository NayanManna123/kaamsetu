import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Github, 
  Instagram, 
  Twitter, 
  Linkedin, 
  HelpCircle, 
  Phone, 
  Shield, 
  FileText,
  ChevronRight
} from 'lucide-react';
import { settingsAPI } from '../api/endpoints';

const Footer = () => {
  const [socialLinks, setSocialLinks] = useState({
    github: 'https://github.com/kaamsetu',
    instagram: 'https://instagram.com/kaamsetu',
    twitter: 'https://twitter.com/kaamsetu',
    linkedin: 'https://linkedin.com/company/kaamsetu',
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const response = await settingsAPI.getSocialLinks();
        if (response.data?.success && response.data?.data) {
          setSocialLinks(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch social links for footer:', error);
      }
    };

    fetchSocialLinks();
  }, []);

  const socialIcons = [
    { name: 'GitHub', icon: Github, url: socialLinks.github, hoverClass: 'hover:text-[#2dba4e] hover:scale-110' },
    { name: 'Instagram', icon: Instagram, url: socialLinks.instagram, hoverClass: 'hover:text-[#E1306C] hover:scale-110' },
    { name: 'Twitter', icon: Twitter, url: socialLinks.twitter, hoverClass: 'hover:text-[#1DA1F2] hover:scale-110' },
    { name: 'LinkedIn', icon: Linkedin, url: socialLinks.linkedin, hoverClass: 'hover:text-[#0077B5] hover:scale-110' },
  ];

  return (
    <footer className="bg-surface-900 text-surface-200 border-t border-surface-800">
      {/* ==================== WEB FOOTER ==================== */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-5 gap-8 mb-12">
          {/* Brand & Social Column */}
          <div className="col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">KS</span>
              </div>
              <span className="text-xl font-bold text-white">
                Kaam<span className="text-primary-400">Setu</span>
              </span>
            </Link>
            <p className="text-sm text-surface-400 max-w-sm">
              Bridging the gap between workers and employers across India. Seamless hiring, verified workers, and instant daily work solutions.
            </p>
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Follow Us</h4>
              <div className="flex gap-4">
                {socialIcons.map(({ name, icon: Icon, url, hoverClass }) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-surface-400 transition-all duration-300 ${hoverClass}`}
                    aria-label={`Follow us on ${name}`}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Column: About */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">About</h3>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">About KaamSetu</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary-400 transition-colors">How it Works</Link></li>
              <li><Link to="/careers" className="hover:text-primary-400 transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Links Column: For Workers */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">For Workers</h3>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li><Link to="/worker/search" className="hover:text-primary-400 transition-colors">Find Jobs</Link></li>
              <li><Link to="/worker/jobs?type=daily" className="hover:text-primary-400 transition-colors">Daily Work</Link></li>
              <li><Link to="/worker/jobs?type=contract" className="hover:text-primary-400 transition-colors">Contract Work</Link></li>
            </ul>
          </div>

          {/* Links Column: For Companies */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">For Companies</h3>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li><Link to="/company/post-job" className="hover:text-primary-400 transition-colors">Post Job</Link></li>
              <li><Link to="/company/workers" className="hover:text-primary-400 transition-colors">Search Workers</Link></li>
              <li><Link to="/company/hires?type=bulk" className="hover:text-primary-400 transition-colors">Bulk Hiring</Link></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-surface-800 my-8" />

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-surface-500">
          <p>© 2026 KaamSetu. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-primary-400 transition-colors">Terms & Conditions</Link>
            <Link to="/support" className="hover:text-primary-400 transition-colors">Support</Link>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE FOOTER ==================== */}
      <div className="block lg:hidden px-4 py-8 space-y-8 max-w-md mx-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xs">KS</span>
            </div>
            <span className="text-lg font-bold text-white">
              Kaam<span className="text-primary-400">Setu</span>
            </span>
          </div>
          <p className="text-xs text-surface-400">Connecting workers and employers across India.</p>
        </div>

        {/* Mobile touch-friendly stacked buttons */}
        <div className="space-y-3">
          <Link 
            to="/support" 
            className="flex items-center justify-between w-full p-4 bg-surface-800 hover:bg-surface-700/80 active:scale-[0.98] transition-all rounded-2xl text-white font-medium text-sm border border-surface-700/50 shadow-sm"
          >
            <span className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary-400" />
              Help & Support
            </span>
            <ChevronRight className="w-4 h-4 text-surface-500" />
          </Link>

          <Link 
            to="/contact" 
            className="flex items-center justify-between w-full p-4 bg-surface-800 hover:bg-surface-700/80 active:scale-[0.98] transition-all rounded-2xl text-white font-medium text-sm border border-surface-700/50 shadow-sm"
          >
            <span className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-success-400" />
              Contact Us
            </span>
            <ChevronRight className="w-4 h-4 text-surface-500" />
          </Link>

          <Link 
            to="/privacy-policy" 
            className="flex items-center justify-between w-full p-4 bg-surface-800 hover:bg-surface-700/80 active:scale-[0.98] transition-all rounded-2xl text-white font-medium text-sm border border-surface-700/50 shadow-sm"
          >
            <span className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-warning-400" />
              Privacy Policy
            </span>
            <ChevronRight className="w-4 h-4 text-surface-500" />
          </Link>

          <Link 
            to="/terms-conditions" 
            className="flex items-center justify-between w-full p-4 bg-surface-800 hover:bg-surface-700/80 active:scale-[0.98] transition-all rounded-2xl text-white font-medium text-sm border border-surface-700/50 shadow-sm"
          >
            <span className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-accent-400" />
              Terms & Conditions
            </span>
            <ChevronRight className="w-4 h-4 text-surface-500" />
          </Link>
        </div>

        {/* Social Follow */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Follow Us</span>
          <div className="flex gap-6">
            {socialIcons.map(({ name, icon: Icon, url, hoverClass }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2.5 bg-surface-800 rounded-full text-surface-400 hover:text-white active:scale-95 transition-all ${hoverClass}`}
                aria-label={`Follow us on ${name}`}
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="text-center text-[10px] text-surface-500 pt-4 border-t border-surface-800">
          <p>© 2026 KaamSetu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
