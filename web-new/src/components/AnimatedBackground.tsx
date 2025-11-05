'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; scale: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      scale: 0.5 + Math.random() * 0.5,
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute h-2 w-2 rounded-full bg-primary/20 blur-sm"
          initial={{ x: `${particle.x}%`, y: `${particle.y}%`, scale: particle.scale }}
          animate={{
            x: [`${particle.x}%`, `${(particle.x + 20) % 100}%`],
            y: [`${particle.y}%`, `${(particle.y + 20) % 100}%`],
            scale: [particle.scale, particle.scale * 1.5, particle.scale],
          }}
          transition={{
            duration: 20 + particle.id * 2,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
