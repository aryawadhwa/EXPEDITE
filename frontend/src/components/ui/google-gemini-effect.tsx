"use client";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import React, { useRef } from "react";

export const GoogleGeminiEffect = ({
  pathLengths = [],
  title,
  description,
  className,
}: {
<<<<<<< HEAD
  pathLengths?: (number | MotionValue<number>)[];
=======
  pathLengths?: number[] | MotionValue<number>[];
>>>>>>> 121a10c465cc9a1c726b10e3553215c7cba47c59
  title?: string;
  description?: string;
  className?: string;
}) => {
  return (
    <div className={`sticky top-80 ${className}`}>
      <p className="text-lg md:text-7xl font-bold dark:text-white text-white text-center">
        {title || "Build with Aceternity UI"}
      </p>
      <p className="text-xs md:text-xl font-normal dark:text-white text-white max-w-lg text-center mx-auto mt-8">
        {description || "Scroll to reveal the beauty of this component"}
      </p>
      <div className="w-full h-[890px] -top-60 md:-top-40 flex items-center justify-center bg-red-transparent absolute">
        <button className="relative text-xl md:text-4xl px-8 py-2 rounded-full bg-lime text-black font-bold">
          <div className="absolute inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto from-transparent via-lime to-transparent" />
          <span className="relative z-20">Start for free</span>
        </button>
      </div>

      <svg
        width="1440"
        height="890"
        viewBox="0 0 1440 890"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute -top-60 md:-top-40 w-full"
      >
        <path
          d="M0,300 Q360,150 720,300 T1440,300"
          stroke="url(#gradient1)"
          strokeWidth="2"
          fill="none"
          className="path"
        />
        <path
          d="M0,400 Q360,250 720,400 T1440,400"
          stroke="url(#gradient2)"
          strokeWidth="2"
          fill="none"
          className="path"
        />
        <path
          d="M0,500 Q360,350 720,500 T1440,500"
          stroke="url(#gradient3)"
          strokeWidth="2"
          fill="none"
          className="path"
        />
        <defs>
          <motion.linearGradient
            id="gradient1"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="1440"
            y1="0"
            y2="0"
          >
            <stop stopColor="#18CCFC" stopOpacity="0" />
            <motion.stop
              stopColor="#18CCFC"
              style={{
                stopOpacity: pathLengths[0],
              }}
            />
            <motion.stop
              offset="0.325"
              stopColor="#6344F5"
              style={{
                stopOpacity: pathLengths[0],
              }}
            />
            <motion.stop
              offset="1"
              stopColor="#AE48FF"
              style={{
                stopOpacity: pathLengths[0],
              }}
            />
          </motion.linearGradient>
          <motion.linearGradient
            id="gradient2"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="1440"
            y1="0"
            y2="0"
          >
            <stop stopColor="#18CCFC" stopOpacity="0" />
            <motion.stop
              stopColor="#18CCFC"
              style={{
                stopOpacity: pathLengths[1],
              }}
            />
            <motion.stop
              offset="0.325"
              stopColor="#6344F5"
              style={{
                stopOpacity: pathLengths[1],
              }}
            />
            <motion.stop
              offset="1"
              stopColor="#AE48FF"
              style={{
                stopOpacity: pathLengths[1],
              }}
            />
          </motion.linearGradient>
          <motion.linearGradient
            id="gradient3"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="1440"
            y1="0"
            y2="0"
          >
            <stop stopColor="#18CCFC" stopOpacity="0" />
            <motion.stop
              stopColor="#18CCFC"
              style={{
                stopOpacity: pathLengths[2],
              }}
            />
            <motion.stop
              offset="0.325"
              stopColor="#6344F5"
              style={{
                stopOpacity: pathLengths[2],
              }}
            />
            <motion.stop
              offset="1"
              stopColor="#AE48FF"
              style={{
                stopOpacity: pathLengths[2],
              }}
            />
          </motion.linearGradient>
        </defs>
      </svg>
    </div>
  );
};
