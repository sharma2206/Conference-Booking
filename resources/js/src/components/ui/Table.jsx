import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';

// Responsive table wrapper — scrolls horizontally on tablet, shows card view on mobile
export function Table({ children, className }) {
  return (
    <div className="overflow-x-auto -mx-px">
      <table className={cn('min-w-full divide-y divide-gray-200 dark:divide-slate-700', className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, className }) {
  return (
    <thead className={cn('bg-gray-50 dark:bg-slate-700/50', className)}>
      {children}
    </thead>
  );
}

export function Th({ children, className, sortable, sortDir, onSort, ...props }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap',
        sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-slate-200',
        className,
      )}
      onClick={sortable ? onSort : undefined}
      aria-sort={sortable ? (sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none') : undefined}
      {...props}
    >
      {sortable ? (
        <span className="flex items-center gap-1">
          {children}
          <span className="text-gray-300 dark:text-slate-600" aria-hidden="true">
            {sortDir === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5 text-blue-500" />
            ) : sortDir === 'desc' ? (
              <ChevronDown className="h-3.5 w-3.5 text-blue-500" />
            ) : (
              <span className="flex flex-col -gap-1">
                <ChevronUp   className="h-2.5 w-2.5" />
                <ChevronDown className="h-2.5 w-2.5 -mt-1" />
              </span>
            )}
          </span>
        </span>
      ) : children}
    </th>
  );
}

export function Tbody({ children, className }) {
  return (
    <tbody
      className={cn('bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700', className)}
    >
      {children}
    </tbody>
  );
}

export function Tr({ children, className, onClick, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className, ...props }) {
  return (
    <td
      className={cn('px-4 py-3 text-sm text-gray-700 dark:text-slate-300 whitespace-nowrap', className)}
      {...props}
    >
      {children}
    </td>
  );
}

export function Pagination({ meta, onPageChange, className }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page: current, last_page: last, from, to, total } = meta;

  const pages = () => {
    const arr = [];
    if (last <= 7) {
      for (let i = 1; i <= last; i++) arr.push(i);
    } else if (current <= 4) {
      for (let i = 1; i <= 5; i++) arr.push(i);
      arr.push('…');
      arr.push(last);
    } else if (current >= last - 3) {
      arr.push(1);
      arr.push('…');
      for (let i = last - 4; i <= last; i++) arr.push(i);
    } else {
      arr.push(1);
      arr.push('…');
      for (let i = current - 1; i <= current + 1; i++) arr.push(i);
      arr.push('…');
      arr.push(last);
    }
    return arr;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3',
        'px-4 py-3',
        'bg-white dark:bg-slate-800',
        'border-t border-gray-100 dark:border-slate-700',
        className,
      )}
      aria-label="Pagination"
    >
      <p className="text-sm text-gray-500 dark:text-slate-400 order-2 sm:order-1">
        Showing <span className="font-medium text-gray-700 dark:text-slate-300">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700 dark:text-slate-300">{total}</span> results
      </p>
      <div className="flex items-center gap-1 order-1 sm:order-2" role="navigation">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        {pages().map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-sm text-gray-400 dark:text-slate-500">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              aria-current={p === current ? 'page' : undefined}
              className={cn(
                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                p === current
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700',
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === last}
          className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// Used inside <tbody> when there are no rows
export function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <tr>
      <td colSpan={100}>
        <div className="flex flex-col items-center justify-center py-14 text-center px-6">
          {Icon && (
            <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
              <Icon className="h-7 w-7 text-gray-400 dark:text-slate-400" aria-hidden="true" />
            </div>
          )}
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>
          )}
          {action && <div className="mt-4">{action}</div>}
        </div>
      </td>
    </tr>
  );
}

// Standalone empty state (outside a table)
export function EmptyStateBlock({ title, description, icon: Icon, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-14 text-center px-6', className)}>
      {Icon && (
        <div className="h-14 w-14 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-3">
          <Icon className="h-7 w-7 text-gray-400 dark:text-slate-400" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
      {description && (
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Skeleton row for loading states
export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}
