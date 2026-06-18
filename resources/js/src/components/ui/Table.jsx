import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('min-w-full divide-y divide-gray-200', className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function Th({ children, className, ...props }) {
  return (
    <th
      className={cn('px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider', className)}
      {...props}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }) {
  return <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>;
}

export function Tr({ children, className, onClick, ...props }) {
  return (
    <tr
      className={cn(onClick && 'cursor-pointer hover:bg-gray-50', 'transition-colors', className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className, ...props }) {
  return (
    <td className={cn('px-4 py-3 text-sm text-gray-700 whitespace-nowrap', className)} {...props}>
      {children}
    </td>
  );
}

export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page: current, last_page: last, from, to, total } = meta;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Showing {from}–{to} of {total} results
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {Array.from({ length: Math.min(5, last) }, (_, i) => {
          let page;
          if (last <= 5) page = i + 1;
          else if (current <= 3) page = i + 1;
          else if (current >= last - 2) page = last - 4 + i;
          else page = current - 2 + i;

          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium',
                page === current
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === last}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <tr>
      <td colSpan={100}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {Icon && <Icon className="h-12 w-12 text-gray-300 mb-3" />}
          <p className="text-sm font-medium text-gray-900">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          {action}
        </div>
      </td>
    </tr>
  );
}
