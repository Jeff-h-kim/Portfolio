import headshotJPG from '../../assets/headshot.jpg';

const AboutSection = () => {
  const skills = [
    'C', 'C++', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'SQL', 'HTML',
    'Tailwind CSS', 'Figma', 'Git', 'OpenGL', 'CMake', 'JUnit', 'Mocha'
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-gray-800">About Me</h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="w-80 h-80 mx-auto">
                <img 
                src = {headshotJPG}
                alt = "Headshot"
                className = "w-full h-full object-cover rounded-2xl shadow-lg"
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-semibold mb-6 text-gray-800">
                Passionate Software Developer
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                I’m a backend-focused developer with experience in C++, Java, Python, and SQL. 
                I’ve built systems ranging from real-time game engines to scalable social media databases. 
                My projects emphasize clean architecture, test-driven development, and efficient, maintainable code.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Outside of coding, I enjoy making video games that bring systems design and creativity together. 
                I’m also an avid outdoor enthusiast — whether I’m climbing, hiking, or snowboarding, I’m always chasing new challenges and creative ways to move through the world.
              </p>
              
              <div>
                <h4 className="text-lg text-center font-semibold mb-4 text-gray-800">Technologies I Work With:</h4>
                <div className="flex flex-wrap justify-center gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-indigo-100 text-black px-3 py-1 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;