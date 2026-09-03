import React, { useState } from 'react';

interface CountryFlagProps {
  code: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function renderInlineSvgFlag(code: string) {
  switch (code) {
    case 'CZ':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="300" fill="#FFFFFF" />
          <rect y="300" width="900" height="300" fill="#D7141A" />
          <polygon points="0,0 450,300 0,600" fill="#11457E" />
        </svg>
      );
    case 'AT':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="200" fill="#C8102E" />
          <rect y="200" width="900" height="200" fill="#FFFFFF" />
          <rect y="400" width="900" height="200" fill="#C8102E" />
        </svg>
      );
    case 'DE':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="200" fill="#000000" />
          <rect y="200" width="900" height="200" fill="#DD0000" />
          <rect y="400" width="900" height="200" fill="#FFCC00" />
        </svg>
      );
    case 'SK':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="200" fill="#FFFFFF" />
          <rect y="200" width="900" height="200" fill="#0B4EA2" />
          <rect y="400" width="900" height="200" fill="#EE1C25" />
          <path
            d="M180 180 C180 180 320 180 320 300 C320 400 250 450 250 450 C250 450 180 400 180 300 Z"
            fill="#EE1C25"
            stroke="#FFFFFF"
            strokeWidth="12"
          />
          <path d="M250 220 L250 380 M210 270 L290 270 M220 330 L280 330" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" />
        </svg>
      );
    case 'PL':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="300" fill="#FFFFFF" />
          <rect y="300" width="900" height="300" fill="#DC143C" />
        </svg>
      );
    case 'IT':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="300" height="600" fill="#009246" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#CE2B37" />
        </svg>
      );
    case 'FR':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="300" height="600" fill="#0055A4" />
          <rect x="300" width="300" height="600" fill="#FFFFFF" />
          <rect x="600" width="300" height="600" fill="#EF4135" />
        </svg>
      );
    case 'HR':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="200" fill="#FF0000" />
          <rect y="200" width="900" height="200" fill="#FFFFFF" />
          <rect y="400" width="900" height="200" fill="#0000FF" />
          <rect x="375" y="160" width="150" height="180" fill="#FF0000" stroke="#FFFFFF" strokeWidth="8" />
        </svg>
      );
    case 'ES':
      return (
        <svg viewBox="0 0 900 600" className="w-full h-full">
          <rect width="900" height="150" fill="#AA151B" />
          <rect y="150" width="900" height="300" fill="#F1BF00" />
          <rect y="450" width="900" height="150" fill="#AA151B" />
        </svg>
      );
    default:
      return (
        <div className="w-full h-full bg-amber-400 flex items-center justify-center text-[10px] font-black text-black">
          {code}
        </div>
      );
  }
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  name,
  className = '',
  size = 'md'
}) => {
  const [imgError, setImgError] = useState(false);
  const normalizedCode = (code || 'CZ').toUpperCase();

  const sizeClasses = {
    sm: 'w-5 h-3.5',
    md: 'w-7 h-5',
    lg: 'w-9 h-6'
  };

  const dim = sizeClasses[size] || sizeClasses.md;

  if (!imgError) {
    return (
      <span 
        className={`inline-flex items-center justify-center rounded-sm overflow-hidden shadow-xs border border-black/30 dark:border-white/30 flex-shrink-0 ${dim} ${className}`}
        title={name || code}
      >
        <img
          src={`https://flagcdn.com/${code.toLowerCase()}.svg`}
          alt={name || code}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center justify-center rounded-sm overflow-hidden shadow-xs border border-black/30 dark:border-white/30 flex-shrink-0 ${dim} ${className}`}
      title={name || code}
    >
      {renderInlineSvgFlag(normalizedCode)}
    </span>
  );
};
