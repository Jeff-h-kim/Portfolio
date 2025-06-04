import { Menu, X, Github, Linkedin, Mail, ExternalLink, ChevronDown } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 w-full">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Jeff Kim
            </div>
            <p className="text-gray-400 mt-2">Building the future, one line of code at a time.</p>
          </div>
         
          <div className="flex space-x-6">
            <a
              href="https://github.com/Jeffkim6511"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github size={24} />
            </a>
            <a
              href="https://www.linkedin.com/in/jeff-kim/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Linkedin size={24} />
            </a>
            <a
              href="mailto:jeffkim6511@gmail.com"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Mail size={24} />
            </a>
          </div>
        </div>
       
        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Jeff Kim. All rights reserved. Built with React & Tailwind CSS.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;