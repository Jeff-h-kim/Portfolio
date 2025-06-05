import { useState } from 'react'
import Header from '../sections/Header.jsx';
import HeroSection from '../sections/HeroSection';
import AboutSection from '../sections/AboutSection';
import ProjectsSection from '../sections/ProjectsSection';
import ContactSection from '../sections/ContactSection';
import Footer from '../sections/Footer';

const HomePage = ({ setCurrentPage }) => {
  const [activeSection, setActiveSection] = useState('Home');

  return (
    <div className="min-h-screen">
      <Header 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
        setCurrentPage={setCurrentPage}
        currentPage="home"
      />
      <HeroSection />
      <AboutSection />
      <ProjectsSection setCurrentPage={setCurrentPage} />
      <ContactSection />
      <Footer 
        setCurrentPage={setCurrentPage}
        currentPage="home"
      />
    </div>
  );
};

export default HomePage