import { useState } from 'react'
import './App.css'
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ProjectsSection from './components/ProjectsSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

const App = () => {
  const [activeSection, setActiveSection] = useState('Home');

  return (
    <div className="min-h-screen">
      <Header activeSection={activeSection} setActiveSection={setActiveSection} />
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default App
