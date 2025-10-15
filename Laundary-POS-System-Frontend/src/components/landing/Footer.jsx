import { Facebook } from 'lucide-react';

/**
 * Footer Component
 * Displays copyright and social media links
 */
const Footer = () => {
  return (
    <footer className="bg-navy text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} FoldFox Laundry. All rights reserved.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-300 text-sm">Follow us:</span>
            <a
              href="https://web.facebook.com/profile.php?id=61579580631873"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 hover:bg-orange p-2 rounded-full transition-all duration-300 hover:scale-110"
              aria-label="Visit our Facebook page"
            >
              <Facebook className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

