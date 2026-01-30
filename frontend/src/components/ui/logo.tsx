import { motion } from "framer-motion";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Abstract geometric shape - interlocking angular forms */}
      
      {/* Outer triangle - representing expansion and reach */}
      <motion.path
        d="M 20 4 L 36 20 L 20 28 L 20 4 Z"
        fill="currentColor"
        fillOpacity="0.9"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
      
      {/* Middle geometric element - speed and precision */}
      <motion.path
        d="M 20 12 L 28 20 L 20 36 L 12 20 L 20 12 Z"
        fill="currentColor"
        fillOpacity="0.7"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      />
      
      {/* Inner accent - AI core */}
      <motion.path
        d="M 20 16 L 24 20 L 20 24 L 16 20 L 20 16 Z"
        fill="currentColor"
        fillOpacity="0.4"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
      />
      
      {/* Forward arrow element - suggesting motion and expediting */}
      <motion.path
        d="M 4 20 L 12 16 L 12 24 L 4 20 Z"
        fill="currentColor"
        fillOpacity="0.6"
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
};
