import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ activeSection, setActiveSection }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navItems = ['Home', 'About', 'Projects', 'Contact'];
  
  const scrollToSection = (section) => {
    const element = document.getElementById(section.toLowerCase());
    element?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(section);
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b !border-gray-400">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Jeff Kim
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`transition-colors hover:text-blue-600 ${
                  activeSection === item ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          
          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            {navItems.map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item)}
                className={`block w-full text-left py-2 transition-colors hover:text-blue-600 ${
                  activeSection === item ? 'text-blue-600 font-medium' : 'text-gray-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;