import digitRecognizerDemo from '../../assets/digit-recognizer-demo.gif';
import teaTimerDemo from '../../assets/tea-timer-demo.jpg'
import cyberYagaDemo from '../../assets/cyber-yaga-demo.gif'
import floodFillDemo from '../../assets/flood-fill-demo.gif'
import rubixCubeDemo from '../../assets/rubix-cube-demo.gif'
import ctdDemo from '../../assets/chaotic-tower-defense-demo.gif'

export const allProjects = [
    {
    title: "Cyber-Yaga Vindicta",
    description: "Fast-paced, top-down action shooter blending advanced AI, dynamic lighting, and immersive audio-visual effects for a tactically rich gameplay experience.",
    tech: ["C++", "CMake", "OpenGL"],
    gif: cyberYagaDemo,
    github: "https://github.com/Jeff-h-kim/Cyber-Yaga-Vindicta"
  },
  {
    title: "Tea Timer",
    description: "Arduino-powered smart timer with ultrasonic sensor, LCD display, and buzzer that detects tea pouring and helps you steep the perfect cup.",
    tech: ["C++", "Arduino Uno", "Circuit Design"],
    gif: teaTimerDemo,
    github: "https://github.com/Jeff-h-kim/TeaTimer"
  },
  {
    title: "Digit Recognizer",
    description: "Interactive desktop app using CNN trained on MNIST dataset to accurately identify handwritten digits drawn on canvas in real time.",
    tech: ["Python", "TensorFlow", "Keras", "Tkinter"],
    gif: digitRecognizerDemo,
    github: "https://github.com/Jeff-h-kim/DigitRecognition"
  },
  {
    title: "FloodFill",
    description: "A C++ project for UBC's CPSC 221 that implements and visualizes flood fill algorithms on PNG images using custom stack and queue data structures with both DFS and BFS approaches.",
    tech: ["C++", "DFS & BFS Algorithms", "Custom Stack & Queue", "PNG Image Processing", "Functor Design Pattern"],
    gif: floodFillDemo,
    github: "https://github.com/Jeff-h-kim/FloodFill"
  },
  {title: "Rubix Cube Timer",
    description: "A customizable Rubik's Cube timer app that tracks solve times, generates scrambles, analyzes performance with visual stats, and saves session data to help cubers improve over time.",
    tech: ["Java", "Test Driven Development", "File Storage", "JUnit"],
    gif: rubixCubeDemo,
    github: "https://github.com/Jeff-h-kim/RubixCubeTimer"
  },
   {title: "Chaotic Tower Defense",
    description: "Chaotic Tower Defense is a tower defense game featuring procedurally generated levels, rotating towers, and animated invaders for an immersive tower defense experience.",
    tech: ['C++', 'OpenGL', 'SDL2', 'FreeType', 'Procedural Generation'],
    gif: ctdDemo,
    github: "https://github.com/Jeff-h-kim/Chaotic-Tower-Defense"
  }
];

export const featuredProjects = [
  allProjects[0], allProjects[1], allProjects[2]
];

export const technologies = [
  "C++", "Python", "JavaScript", "React", "Node.js", "TensorFlow", 
  "OpenGL", "Arduino", "Unity", "MongoDB", "PostgreSQL", "TypeScript"
];

export default { featuredProjects, allProjects, technologies };