import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  footer,
  onClick
}) => {
  return (
    <div
      className={`bg-slate-900/70 rounded-xl shadow-sm border border-slate-800 overflow-hidden ${
        onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''
      } ${className}`}
      onClick={onClick}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-white/10">
          {title && (
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-3 bg-slate-900/40 border-t border-white/10">
          {footer}
        </div>
      )}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-white/10 ${className}`}>
    {children}
  </div>
);

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-4 ${className}`}>{children}</div>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
  <div className={`px-6 py-3 bg-slate-900/40 border-t border-white/10 ${className}`}>
    {children}
  </div>
);

