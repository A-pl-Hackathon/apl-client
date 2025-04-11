"use client";

import React, { FC, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

interface MatrixRainProps {
  className?: string;
  columns?: number;
  height?: number;
  fullScreen?: boolean;
  charSet?: string[];
}

interface MatrixColumn {
  text: string;
  speed: number;
  opacity: number;
  left: number;
  isSpecial: boolean;
  delay: number;
  chars: {
    isHighlighted: boolean;
    opacity: number;
    fontWeight: number;
  }[];
}

const MatrixRain: FC<MatrixRainProps> = ({
  className = "",
  columns = 30,
  height = 600,
  fullScreen = false,
  charSet = ["0", "1"],
}) => {
  const [windowDimensions, setWindowDimensions] = useState<{
    width: number;
    height: number;
  }>({
    width: 1200,
    height: 800,
  });

  const [matrixColumns, setMatrixColumns] = useState<MatrixColumn[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    if (fullScreen) {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, [fullScreen]);

  useEffect(() => {
    if (!fullScreen || !isClient) return;

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [fullScreen, isClient]);

  useEffect(() => {
    if (!isClient) return;

    const dynamicColumns = fullScreen
      ? Math.max(15, Math.floor(windowDimensions.width / 40))
      : columns;

    const newColumns: MatrixColumn[] = Array.from(
      { length: dynamicColumns },
      (_, index) => {
        const length = 10 + Math.floor(Math.random() * 30);
        const chars = Array.from({ length }, () => {
          const randomIndex = Math.floor(Math.random() * charSet.length);
          return charSet[randomIndex];
        });

        const charDetails = chars.map(() => ({
          isHighlighted: Math.random() > 0.85,
          opacity: 0.7 + Math.random() * 0.3,
          fontWeight: Math.random() > 0.85 ? 700 : 400,
        }));

        return {
          text: chars.join(""),
          speed: 2 + Math.random() * 4,
          opacity: 0.6 + Math.random() * 0.4,
          left: (index / dynamicColumns) * 100,
          isSpecial: Math.random() > 0.9,
          delay: Math.random() * 2,
          chars: charDetails,
        };
      }
    );

    setMatrixColumns(newColumns);
  }, [isClient, columns, charSet, fullScreen, windowDimensions.width]);

  const effectiveHeight = fullScreen ? windowDimensions.height : height;

  if (!isClient) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black ${className}`}
        style={{
          height: effectiveHeight,
          width: "100%",
        }}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black ${className}`}
      style={{
        height: effectiveHeight,
        width: "100%",
      }}
    >
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-black/50 z-10" />

      {matrixColumns.map((column, index) => {
        const initialY = -100 - Math.random() * 100; // Staggered starting positions
        const blur = Math.random() > 0.8 ? "blur(1px)" : "none"; // Random blur for some columns
        const fontSize = Math.random() > 0.9 ? "1.1rem" : "0.9rem"; // Varied text sizes

        return (
          <motion.div
            key={index}
            className="absolute top-0 flex flex-col items-center font-mono leading-none pointer-events-none"
            style={{
              left: `${column.left}%`,
              transform: "translateX(-50%)",
              opacity: column.opacity,
              filter: blur,
              fontSize,
              letterSpacing: "-1px",
              color: column.isSpecial ? "rgb(0, 255, 170)" : "rgb(0, 230, 100)",
              textShadow: "0 0 5px rgba(0, 255, 140, 0.7)",
            }}
            initial={{ y: initialY }}
            animate={{ y: `${effectiveHeight + 100}px` }}
            transition={{
              duration: column.speed,
              repeat: Infinity,
              ease: "linear",
              delay: column.delay,
            }}
          >
            {column.text.split("").map((char, i) => {
              const charInfo = column.chars[i] || {
                isHighlighted: false,
                opacity: 0.8,
                fontWeight: 400,
              };

              return (
                <motion.div
                  key={i}
                  className={charInfo.isHighlighted ? "animate-pulse-glow" : ""}
                  style={{
                    fontWeight: charInfo.fontWeight,
                    opacity: charInfo.isHighlighted ? 1 : charInfo.opacity,
                  }}
                  animate={
                    charInfo.isHighlighted
                      ? {
                          opacity: [0.7, 1, 0.7],
                        }
                      : {}
                  }
                  transition={
                    charInfo.isHighlighted
                      ? {
                          duration: 1 + Math.random() * 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : {}
                  }
                >
                  {char}
                </motion.div>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
};

export default MatrixRain;
