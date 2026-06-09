import { cn } from '../../lib/utils';
import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 transition min-h-[2.75rem]',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
            error ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full border rounded-lg px-3 py-2.5 text-sm bg-white text-slate-900 transition min-h-[2.75rem]',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent',
            error ? 'border-rose-400' : 'border-slate-200 hover:border-slate-300',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';
