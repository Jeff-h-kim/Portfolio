import React from 'react';
import Header from '../sections/Header.jsx';
import Footer from '../sections/Footer';
import ProjectCard from '../common/ProjectCard';
import Projects from '../data/Projects.js';
import ProjectDynamicBackground from '../common/ProjectDynamicBackground.jsx'; // Import the background
import { ArrowLeft } from 'lucide-react';

const AllProjectsPage = ({ setCurrentPage }) => {
    const allProjects = Projects.allProjects || Projects.featuredProjects;

    const handleBackToHome = () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
        setCurrentPage('home');
        
    };

    return (
        <div className="min-h-screen relative">
            {/* Add the dynamic background */}
             <ProjectDynamicBackground className="fixed inset-0 w-full h-full" style={{ zIndex: -1 }} />
            
            <Header 
                setCurrentPage={setCurrentPage} 
                currentPage="allProjects"
            />
            <section className="pt-28 md:pt-32 py-20 min-h-screen relative">
                <div className="container mx-auto px-6">
                    <div className="mt-12 max-w-6xl mx-auto">
                        <h1 className="text-5xl font-bold text-center mb-4 text-gray-800">All Projects</h1>
                        <p className="text-xl text-gray-700 text-center mb-16 max-w-3xl mx-auto">
                            Explore my complete portfolio of projects, from web applications to machine learning experiments.
                        </p>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {allProjects.map((project, index) => (
                                <ProjectCard key={index} {...project} />
                            ))}
                        </div>

                        {allProjects.length === 0 && (
                            <div className="text-center py-20">
                                <p className="text-gray-600 text-xl">More projects coming soon!</p>
                            </div>
                        )}

                        <div className="pt-16 flex justify-center">
                            <button
                                onClick={handleBackToHome}
                                className="flex items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg hover:transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl touch-manipulation"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <Footer 
                setCurrentPage={setCurrentPage} 
                currentPage="allProjects"
            />
        </div>
    );
};

export default AllProjectsPage;