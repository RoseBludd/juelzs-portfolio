import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
}) => {
  const baseClasses = 'bg-gray-800 border border-gray-700 rounded-lg';
  const hoverClasses = hover ? 'hover:bg-gray-750 hover:border-gray-600 transition-all duration-200 cursor-pointer' : '';
  
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  
  const combinedClasses = `${baseClasses} ${hoverClasses} ${paddingClasses[padding]} ${className}`;
  
  if (onClick) {
    return (
      <div className={combinedClasses} onClick={onClick}>
        {children}
      </div>
    );
  }
  
  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

export default Card; 