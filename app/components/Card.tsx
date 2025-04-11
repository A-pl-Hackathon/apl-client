"use client";

import React, { ReactNode } from "react";

interface CardProps {
  title: string;
  children: ReactNode;
  className?: string;
  titleClassName?: string;
}

export default function Card({
  title,
  children,
  className = "",
  titleClassName = "text-xl font-bold mb-3 text-white",
}: CardProps) {
  const hasBgColor = className.includes("bg-");
  const baseClasses = hasBgColor
    ? "rounded-lg shadow-md p-4 backdrop-blur-sm"
    : "bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-md p-4";

  return (
    <div className={`${baseClasses} ${className}`}>
      <h3 className={titleClassName}>{title}</h3>
      {children}
    </div>
  );
}
