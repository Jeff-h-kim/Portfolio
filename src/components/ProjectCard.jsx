import React from 'react';
import { ExternalLink, Github } from 'lucide-react';

const ProjectCard = ({ title, description, tech, image, gif, link, github }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold relative overflow-hidden">
        {gif ? (
          <img 
            src={gif}
            alt={`${title} demo`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : image ? (
          <img 
            src={image} 
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          title.substring(0, 2)
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
        <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tech.map((item) => (
            <span
              key={item}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm"
            >
              {item}
            </span>
          ))}
        </div>
        
        <div className="flex gap-4">
          {link && (
            <button className="flex items-center gap-2 !text-blue-600 hover:!text-blue-700 !transition-colors">
              <ExternalLink size={16} />
              Live Demo
            </button>
          )}
          {github && (
            <a 
              href={github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 !text-gray-500 hover:!text-gray-800 !transition-colors"
            >
              <Github size={16} />
              Source Code
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;