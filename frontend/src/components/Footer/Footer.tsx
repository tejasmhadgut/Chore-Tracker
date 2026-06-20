import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className='bg-slate-800/85 border-t border-slate-700 mt-8'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
          {/* Brand */}
          <div>
            <h3 className='text-white font-bold text-lg mb-2'>ChoreTrack</h3>
            <p className='text-gray-400 text-sm'>Simplify your chores, simplify your life.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-cyan-400 font-semibold mb-4'>Product</h4>
            <ul className='space-y-2'>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Features</a></li>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Pricing</a></li>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Security</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className='text-cyan-400 font-semibold mb-4'>Company</h4>
            <ul className='space-y-2'>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>About Us</a></li>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Contact</a></li>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Blog</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className='text-cyan-400 font-semibold mb-4'>Legal</h4>
            <ul className='space-y-2'>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Privacy Policy</a></li>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Terms of Service</a></li>
              <li><a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors text-sm'>Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className='border-t border-slate-700 pt-6 flex flex-col md:flex-row justify-between items-center'>
          <p className='text-gray-400 text-sm'>&copy; 2026 ChoreTrack. All rights reserved.</p>
          <div className='flex gap-4 mt-4 md:mt-0'>
            <a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors'>
              <span className='text-sm'>Twitter</span>
            </a>
            <a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors'>
              <span className='text-sm'>Facebook</span>
            </a>
            <a href='#' className='text-gray-400 hover:text-cyan-400 transition-colors'>
              <span className='text-sm'>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
