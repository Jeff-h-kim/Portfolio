import React from 'react';
import { Github } from 'lucide-react';

const ProjectCard = ({ title, description, tech, image, gif, link, github }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group flex flex-col">
      <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
        {gif ? (
          <img 
            src={gif}
            alt={`${title} demo`}
            className="w-full h-full object-cover object-top"
          />
        ) : image ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white text-2xl font-bold">
            {title.substring(0, 2)}
          </div>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold mb-3 text-gray-800">{title}</h3>
        <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tech.map((item) => (
            <span
              key={item}
              className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Spacer to push source code to bottom */}
        <div className="mt-auto pt-4 border-t border-gray-200">
          {github && (
            <a 
              href={github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-500 hover:text-gray-800 transition-colors"
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
