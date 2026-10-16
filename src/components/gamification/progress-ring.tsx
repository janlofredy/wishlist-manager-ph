"use client";

import React from "react";

interface ProgressRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  progress = 0,
  size = 120,
  strokeWidth = 10,
  colorClass = "stroke-primary",
  label,
  sublabel,
}: ProgressRingProps) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (normalizedProgress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30 fill-transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} fill-transparent transition-all duration-700 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        {label && (
          <span className="text-xl font-black tracking-tight">{label}</span>
        )}
        {sublabel && (
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
