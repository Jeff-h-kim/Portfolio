import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Navigation = ({ currentPage, setCurrentPage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
  ];

  const scrollToSection = (sectionId) => {
    if (currentPage === 'home') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setCurrentPage('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-800">Portfolio</div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => item.id === 'projects' ? setCurrentPage('projects') : setCurrentPage('home')}
                className={`transition-colors ${
                  currentPage === item.id ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                {item.label}
              </button>
            ))}
            {currentPage === 'home' && (
              <>
                <button
                  onClick={() => scrollToSection('about')}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Contact
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  item.id === 'projects' ? setCurrentPage('projects') : setCurrentPage('home');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </button>
            ))}
            {currentPage === 'home' && (
              <>
                <button
                  onClick={() => {
                    scrollToSection('about');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  About
                </button>
                <button
                  onClick={() => {
                    scrollToSection('contact');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Contact
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;