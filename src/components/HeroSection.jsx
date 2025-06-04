import resumePDF from '../assets/Jeff_Kim_Resume_2025.pdf';
import DynamicBackground from './DynamicBackground';

const HeroSection = () => {
  const scrollToProjects = () => {
    const element = document.getElementById('projects');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const downloadCV = () => {
    const link = document.createElement('a');
    link.href = resumePDF;
    link.download = 'Jeff_Kim_Resume_2025.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Background */}
      <DynamicBackground 
        className="z-0"
        style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #faf5ff 100%)' }}
      />
      
      {/* Content Overlay */}
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Jeff Kim
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Full Stack Developer
          </p>
          <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
            Behind every great interface is a great backend — I build that.
            Driven by problem-solving, performance, and elegant engineering.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={scrollToProjects}
              className="!bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              View My Work
            </button>
            
            <button 
              onClick={downloadCV}
              className="border !border-gray-300 !text-gray-700 px-8 py-3 rounded-lg hover:border-gray-600 hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:scale-105 backdrop-blur-sm bg-white/80"
            >
              Download CV
            </button>
          </div>
          <div className="mt-16 animate-bounce">
            <div className="mx-auto w-6 h-6 border-r-2 border-b-2 border-gray-400 transform rotate-45"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;