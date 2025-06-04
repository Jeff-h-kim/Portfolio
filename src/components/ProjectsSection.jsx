import React from 'react';
import ProjectCard from './ProjectCard';
import digitRecognizerDemo from '../assets/digit-recognizer-demo.gif';
import teaTimerDemo from '../assets/tea-timer-demo.jpg'
import cyberYagaDemo from '../assets/cyber-yaga-demo.gif'

const ProjectsSection = () => {
  const projects = [
    {
      title: "Cyber-Yaga Vindicta",
      description: "Cyber-Yaga Vindicta is a fast-paced, top-down action shooter blending advanced AI, dynamic lighting, and immersive audio-visual effects for a tactically rich gameplay experience.",
      tech: ["C++", "CMake", "OpenGL"],
      gif: cyberYagaDemo,
      link: "#",
      github: "https://github.com/Jeffkim6511/Cyber-Yaga-Vindicta"
    },
    {
      title: "Tea Timer",
      description: "Smart Tea Timer with Ultrasonic Sensor, LCD, and Buzzer is an Arduino-powered timer that detects when tea is being poured, displays brew time on an LCD, and plays periodic jingles to help you steep the perfect cup.",
      tech: ["C++", "Arduino Uno", "Circuit Design"],
      gif: teaTimerDemo,
      link: "#",
      github: "https://github.com/Jeffkim6511/TeaTimer"
    },
    {
      title: "Digit Recognizer",
      description: "Digit Recognizer is an interactive desktop app that uses a CNN trained on the MNIST dataset to accurately identify handwritten digits drawn on a canvas in real time.",
      tech: ["Python", "TensorFlow", "Keras", "Tkinter", "Pillow", "MNIST Dataset"],
      gif: digitRecognizerDemo,
      link: "#",
      github: "https://github.com/Jeffkim6511/DigitRecognition"
    }
  ];

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">Projects</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
          
          {/* <div className="text-center mt-12">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              View All Projects
            </button>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;