import { Transition } from 'framer-motion';

// Medical Calm transitions: smooth, natural, and never jarring
export const transitions: Record<string, Transition> = {
  // Default smooth ease-out for content appearance
  smooth: {
    duration: 0.55,
    ease: [0.25, 0.1, 0.25, 1],
  },
  // Slightly faster for micro-interactions and buttons
  fast: {
    duration: 0.25,
    ease: 'easeOut',
  },
  // Relaxed calm spring for cards and modals
  calmSpring: {
    type: 'spring',
    stiffness: 120,
    damping: 18,
    mass: 0.8,
  },
  // Stagger interval standard
  stagger: {
    staggerChildren: 0.07,
    delayChildren: 0.05,
  },
  staggerSlow: {
    staggerChildren: 0.1,
    delayChildren: 0.1,
  },
};
