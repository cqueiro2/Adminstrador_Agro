
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 
          placeholder:text-slate-400 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200
          ${error ? 'ring-2 ring-red-500/20 bg-red-50' : ''} 
          ${className || ''}
        `}
        {...props}
      />
      {error && <p className="mt-2 text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`
          block w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-sm font-medium text-slate-900 
          placeholder:text-slate-400 focus:ring-2 focus:ring-brand/20 focus:bg-white transition-all duration-200
          ${error ? 'ring-2 ring-red-500/20 bg-red-50' : ''} 
          ${className || ''}
        `}
        rows={3}
        {...props}
      />
      {error && <p className="mt-2 text-xs font-medium text-red-500 ml-1">{error}</p>}
    </div>
  );
};
