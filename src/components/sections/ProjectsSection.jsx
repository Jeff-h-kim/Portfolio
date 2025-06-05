import React from 'react';
import ProjectCard from '../common/ProjectCard';
import Projects from '../../components/data/Projects.js';

const ProjectsSection = ({ setCurrentPage }) => {
  const projects = Projects.featuredProjects;

  const handleViewAllProjects = () => {
    setCurrentPage('all-projects');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100); // Give time for page change
  };

  return (
    <section id="projects" className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">
            Featured Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={handleViewAllProjects}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              View All Projects
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectsSection;
