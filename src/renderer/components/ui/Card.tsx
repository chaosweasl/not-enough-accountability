import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  className = '',
  padding = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`card bg-base-100 shadow-lg border border-base-200 ${className}`}
      {...props}
    >
      <div className={`card-body ${paddingClasses[padding]}`}>
        {title && (
          <h2 className="card-title text-base-content mb-2">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
};

export default Card;