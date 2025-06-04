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
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b !border-gray-400" >
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => scrollToSection('Home')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="51" viewBox="0 0 50 51" fill="none">
              <rect x="2.83018" y="0.735847" width="47.1698" height="47.1698" rx="9.43396" fill="url(#paint0_linear_7_2)" />
              <rect y="3.09434" width="47.1698" height="47.1698" rx="9.43396" fill="url(#paint1_linear_7_2)" />
              <g filter="url(#filter0_d_7_2)">
                <path d="M40.8348 32.9032L39.1371 30.8439L42.432 26.7252L39.1371 22.6065L40.8348 20.5472L45.727 26.7252L40.8348 32.9032Z" fill="white" />
                <path d="M6.77897 20.5472L8.47669 22.6065L5.18174 26.7252L8.47669 30.8439L6.77897 32.9032L1.88679 26.7252L6.77897 20.5472Z" fill="white" />
                <path d="M10.2988 34.3932V31.4941C10.9539 31.8709 11.5927 32.1452 12.2151 32.3172C12.8457 32.4892 13.4272 32.5752 13.9595 32.5752C14.6638 32.5752 15.1757 32.3704 15.4951 31.9609C15.8144 31.5515 15.9741 30.9291 15.9741 30.0937V19.1115H18.8978V30.0937C18.8978 31.3795 18.6972 32.4114 18.2959 33.1894C17.8946 33.9674 17.3418 34.5325 16.6375 34.8846C15.9332 35.2286 15.1224 35.4006 14.2052 35.4006C13.4845 35.4006 12.7966 35.3023 12.1414 35.1057C11.4863 34.9174 10.872 34.6799 10.2988 34.3932ZM32.2966 19.1115H36.2768L25.7613 29.8726V25.917L32.2966 19.1115ZM28.7587 25.6959L36.719 35.0566H32.9845L26.7441 27.5877L28.7587 25.6959ZM23.0833 19.1115H26.007V35.0566H23.0833V19.1115Z" fill="white" />
              </g>
              <defs>
                <filter id="filter0_d_7_2" x="0.943399" y="19.1115" width="44.7836" height="17.2325" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dx="-0.943396" dy="0.943396" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_7_2" />
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_7_2" result="shape" />
                </filter>
                <linearGradient id="paint0_linear_7_2" x1="2.83018" y1="24.3208" x2="50" y2="24.3208" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#002A87" />
                  <stop offset="0.711538" stop-color="#572A7B" />
                </linearGradient>
                <linearGradient id="paint1_linear_7_2" x1="0" y1="26.6792" x2="47.1698" y2="26.6792" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#0039B4" />
                  <stop offset="0.711538" stop-color="#743AA2" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Jeff Kim
            </div>
          </div>


          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item}
                onClick={() => scrollToSection(item)}
                className={`text-lg transition-all hover:text-indigo-500 hover:font-bold ${activeSection === item ? 'text-indigo-500 font-bold' : 'text-gray-700'
                  }`}
              >
                {item}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={30} /> : <Menu size={30} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden flex flex-col gap-12 overflow-hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100 mt-4 pb-4' : 'max-h-0 opacity-0'
            }`}
        >
          {navItems.map((item) => (
            <a
              key={item}
              onClick={() => scrollToSection(item)}
              className={`block w-full text-right text-2xl py-2 transition-colors hover:text-indigo-800 ${activeSection === item ? 'text-indigo-500 font-medium' : 'text-gray-700'
                }`}
            >
              {item}
            </a>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;