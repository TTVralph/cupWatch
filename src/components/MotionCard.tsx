'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

type MotionCardProps = HTMLMotionProps<'article'> & {
  children: ReactNode;
  delay?: number;
};

export function MotionCard({ children, className = '', delay = 0, ...props }: MotionCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: 'easeOut' }}
      whileTap={{ scale: 0.995 }}
      className={className}
      {...props}
    >
      {children}
    </motion.article>
  );
}
