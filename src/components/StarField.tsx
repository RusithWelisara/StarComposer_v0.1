import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  twinkleSpeed: number;
}

interface Nebula {
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

interface StarFieldProps {
  className?: string;
  theme?: 'cosmic' | 'nebula' | 'galaxy' | 'aurora';
  intensity?: number;
}

export const StarField: React.FC<StarFieldProps> = ({ 
  className = '', 
  theme = 'cosmic',
  intensity = 1 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const animationRef = useRef<number>();

  const getThemeColors = () => {
    switch (theme) {
      case 'nebula':
        return ['#ff6b9d', '#c44569', '#f8b500', '#ff3838', '#ff9ff3'];
      case 'galaxy':
        return ['#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'];
      case 'aurora':
        return ['#64ffda', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
      default:
        return ['#64ffda', '#ff6b9d', '#ffd93d', '#6bcf7f', '#a78bfa'];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
      initNebulae();
    };

    const initParticles = () => {
      particlesRef.current = [];
      const particleCount = Math.floor((canvas.width * canvas.height) / 12000) * intensity;
      const colors = getThemeColors();
      
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2.5 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          twinkleSpeed: Math.random() * 0.02 + 0.01
        });
      }
    };

    const initNebulae = () => {
      nebulaeRef.current = [];
      if (theme === 'nebula' || theme === 'galaxy') {
        const nebulaCount = Math.floor((canvas.width * canvas.height) / 200000) + 2;
        const colors = getThemeColors();
        
        for (let i = 0; i < nebulaCount; i++) {
          nebulaeRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 300 + 200,
            opacity: Math.random() * 0.1 + 0.05,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.001
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw nebulae
      nebulaeRef.current.forEach(nebula => {
        nebula.rotation += nebula.rotationSpeed;
        
        ctx.save();
        ctx.translate(nebula.x, nebula.y);
        ctx.rotate(nebula.rotation);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, nebula.size);
        gradient.addColorStop(0, nebula.color + Math.floor(nebula.opacity * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, nebula.color + '20');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-nebula.size, -nebula.size, nebula.size * 2, nebula.size * 2);
        ctx.restore();
      });
      
      // Draw particles
      particlesRef.current.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;
        
        // Enhanced twinkle effect
        particle.opacity += (Math.random() - 0.5) * particle.twinkleSpeed;
        particle.opacity = Math.max(0.1, Math.min(1, particle.opacity));
        
        // Draw particle with enhanced glow
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 3;
        
        // Main star
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Cross sparkle effect for larger stars
        if (particle.size > 1.5 && particle.opacity > 0.7) {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = 0.5;
          ctx.shadowBlur = particle.size * 2;
          
          ctx.beginPath();
          ctx.moveTo(particle.x - particle.size * 2, particle.y);
          ctx.lineTo(particle.x + particle.size * 2, particle.y);
          ctx.moveTo(particle.x, particle.y - particle.size * 2);
          ctx.lineTo(particle.x, particle.y + particle.size * 2);
          ctx.stroke();
        }
        
        ctx.restore();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 0 }}
    />
  );
};