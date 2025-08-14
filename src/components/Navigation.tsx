import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold gradient-text">Blaze Intelligence</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Home
            </Link>
            <Link to="/analytics" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Analytics
            </Link>
            <Link to="/demo" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Demo
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blaze-500 transition-colors">
              Contact
            </Link>
            <button className="gradient-blaze text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blaze-500 focus:outline-none"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/analytics"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Analytics
              </Link>
              <Link
                to="/demo"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Demo
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 rounded-md text-gray-700 hover:text-blaze-500"
                onClick={() => setIsOpen(false)}
              >
                Contact
              </Link>
              <button className="w-full gradient-blaze text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;