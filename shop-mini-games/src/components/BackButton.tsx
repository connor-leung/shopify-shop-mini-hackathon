import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'floating';
}

export function BackButton({ onClick, className = '', variant = 'default' }: BackButtonProps) {
  const baseClasses = "flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95";
  
  const variantClasses = variant === 'floating' 
    ? "fixed top-4 left-4 z-50 w-10 h-10 rounded-full"
    : "w-10 h-10 rounded-full";

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
      aria-label="Go back"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-gray-700"
      >
        <path
          d="M19 12H5M12 19L5 12L12 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
