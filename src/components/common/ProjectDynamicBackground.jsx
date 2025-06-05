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
    
    // Enable tone mapping for better glow rendering
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    mountRef.current.appendChild(renderer.domElement);

    // Create particles with physics properties
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3); // x, y, z velocities
    const masses = new Float32Array(particleCount); // for wind resistance

    // Set up particles with physics-based properties
    for (let i = 0; i < particleCount; i++) {
      // Start particles above the screen
      positions[i * 3] = (Math.random() - 0.5) * 1200;     // x - spread across width
      positions[i * 3 + 1] = 400 + Math.random() * 200;    // y - start above screen
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;  // z - depth variation

      // Size affects mass and wind resistance
      const baseSize = 2 + Math.random() * 12;
      sizes[i] = baseSize;
      masses[i] = baseSize * 0.1; // Smaller particles = less mass = more wind effect

      // Initial velocities (slight random horizontal drift)
      velocities[i * 3] = (Math.random() - 0.5) * 0.5;     // x velocity
      velocities[i * 3 + 1] = -1 - Math.random() * 2;      // y velocity (falling)
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // z velocity

      // Enhanced colors with depth-based brightness
      const depth = Math.abs(positions[i * 3 + 2]) / 300;
      const hue = Math.random();
      const saturation = 0.7 + Math.random() * 0.3;
      const lightness = (0.5 + Math.random() * 0.5) * (1 - depth * 0.4);
      
      // Convert HSL to RGB
      const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
      const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
      const m = lightness - c / 2;
      
      let r, g, b;
      if (hue < 1/6) { r = c; g = x; b = 0; }
      else if (hue < 2/6) { r = x; g = c; b = 0; }
      else if (hue < 3/6) { r = 0; g = c; b = x; }
      else if (hue < 4/6) { r = 0; g = x; b = c; }
      else if (hue < 5/6) { r = x; g = 0; b = c; }
      else { r = c; g = 0; b = x; }
      
      colors[i * 3] = r + m;
      colors[i * 3 + 1] = g + m;
      colors[i * 3 + 2] = b + m;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 8, // Base size (will be modified by vertex shader)
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true  // Enable distance-based size attenuation for 3D effect
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Position camera to watch particles fall
    camera.position.set(0, 0, 300);
    camera.lookAt(0, 0, 0);

    // Physics simulation with wind effects
    const animate = () => {
      requestAnimationFrame(animate);

      const positions = particles.geometry.attributes.position.array;
      const time = Date.now() * 0.001;
      
      // Generate wind forces (multiple layers of noise for realism)
      const windStrengthX = Math.sin(time * 0.5) * 0.8 + Math.sin(time * 1.3) * 0.4;
      const windStrengthY = Math.cos(time * 0.3) * 0.3 + Math.sin(time * 0.8) * 0.2;
      const gustiness = Math.sin(time * 2.1) * 0.5 + 0.5; // 0 to 1 gust factor
      
      for (let i = 0; i < particleCount; i++) {
        // Current position
        const x = positions[i * 3];
        const y = positions[i * 3 + 1];
        const z = positions[i * 3 + 2];
        
        // Local wind variation based on position
        const localWindX = windStrengthX + Math.sin(x * 0.01 + time * 2) * 0.3 * gustiness;
        const localWindY = windStrengthY + Math.cos(z * 0.01 + time * 1.5) * 0.2 * gustiness;
        
        // Apply wind force (inversely proportional to mass)
        const windForceX = localWindX / masses[i];
        const windForceY = localWindY / masses[i];
        
        // Apply forces to velocity
        velocities[i * 3] += windForceX * 0.02;     // Wind affects horizontal movement
        velocities[i * 3 + 1] += windForceY * 0.01; // Wind can slow/speed falling
        
        // Apply gravity (constant downward force)
        velocities[i * 3 + 1] -= 0.01;
        
        // Air resistance (velocity dampening)
        velocities[i * 3] *= 0.998;
        velocities[i * 3 + 1] *= 0.999;
        velocities[i * 3 + 2] *= 0.998;
        
        // Update positions
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        
        // Reset particles that fall off screen
        if (y < -400 || Math.abs(x) > 800) {
          // Respawn at top with new properties
          positions[i * 3] = (Math.random() - 0.5) * 1200;
          positions[i * 3 + 1] = 400 + Math.random() * 100;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
          
          // Reset velocity
          velocities[i * 3] = (Math.random() - 0.5) * 0.5;
          velocities[i * 3 + 1] = -1 - Math.random() * 2;
          velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
          
          // New size and mass
          const newSize = 2 + Math.random() * 12;
          sizes[i] = newSize;
          masses[i] = newSize * 0.1;
        }
      }
      
      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.size.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
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
      className={`fixed inset-0 w-full h-full ${className}`}
      style={{
        background: 'linear-gradient(to bottom, #edfffe 80%, #d4fcdd 100%)', // Gradient background
        pointerEvents: 'none',
        zIndex: -1,
        ...style,
      }}
    />
  );
};

export default DynamicBackground;