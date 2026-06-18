import { cn } from '../../lib/utils';

export function Badge({ children, className, variant = 'default', dot = false, ...props }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300',
    primary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    danger:  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    info:    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    purple:  'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  };

  const dotColors = {
    default: 'bg-gray-400 dark:bg-slate-400',
    primary: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger:  'bg-red-500',
    info:    'bg-cyan-500',
    purple:  'bg-purple-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant] ?? variants.default,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[variant] ?? dotColors.default)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
