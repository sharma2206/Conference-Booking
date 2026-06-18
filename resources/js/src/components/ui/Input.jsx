import { cn } from '../../lib/utils';

export function Input({ className, label, error, hint, required, id, ...props }) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
          'bg-white dark:bg-slate-800',
          'text-gray-900 dark:text-slate-100',
          'placeholder-gray-400 dark:placeholder-slate-500',
          'border-gray-300 dark:border-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'dark:focus:ring-blue-500 dark:focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-slate-700/50 dark:disabled:text-slate-500',
          'transition-colors',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-gray-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
}

export function Select({ className, label, error, required, id, children, ...props }) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm',
          'bg-white dark:bg-slate-800',
          'text-gray-900 dark:text-slate-100',
          'border-gray-300 dark:border-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'dark:focus:ring-blue-500 dark:focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-slate-700/50',
          'transition-colors',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      >
        {children}
      </select>
      {error && <p role="alert" className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

export function Textarea({ className, label, error, required, id, ...props }) {
  const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 dark:text-slate-300">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={3}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm resize-y',
          'bg-white dark:bg-slate-800',
          'text-gray-900 dark:text-slate-100',
          'placeholder-gray-400 dark:placeholder-slate-500',
          'border-gray-300 dark:border-slate-600',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'dark:focus:ring-blue-500 dark:focus:border-blue-500',
          'transition-colors',
          error && 'border-red-500 focus:ring-red-500',
          className,
        )}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p role="alert" className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
