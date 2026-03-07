
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children, className, actions }) => {
  return (
    <div className={`bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden ${className || ''}`}>
      {(title || actions) && (
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center">
          {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
          {actions && <div className="space-x-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
