import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DynamicBackground = ({ className = "", style = {} }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Basic setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create particles
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Set up particles randomly
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1000;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1000; // y  
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1000; // z

      // Vibrant random colors across full spectrum
      colors[i * 3] = Math.random();     // Red (0 to 1)
      colors[i * 3 + 1] = Math.random(); // Green (0 to 1)
      colors[i * 3 + 2] = Math.random(); // Blue (0 to 1)
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 300;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);

      // Move all particles in same direction
      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += 0.5;     // Move right and up 
        positions[i * 3 + 1] += 0.2;
        
        // Reset when off screen
        if (positions[i * 3] > 500) {
          positions[i * 3] = -500;
        }
        if (positions[i * 3 + 1] > 500) {
          positions[i * 3 + 1] = -500;
        }
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 ${className}`}
      style={{
        ...style,
        pointerEvents: 'none'
      }}
    />
  );
};

export default DynamicBackground;