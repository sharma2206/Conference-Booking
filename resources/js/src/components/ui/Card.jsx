import { cn } from '../../lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800',
        'rounded-xl border border-gray-200 dark:border-slate-700',
        'shadow-sm',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-b border-gray-100 dark:border-slate-700', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, as: Tag = 'h3', ...props }) {
  return (
    <Tag
      className={cn('text-base font-semibold text-gray-900 dark:text-white', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('px-6 py-4 border-t border-gray-100 dark:border-slate-700', className)}
      {...props}
    >
      {children}
    </div>
  );
}

const STAT_COLORS = {
  blue:   { bg: 'bg-blue-50   dark:bg-blue-900/20',   icon: 'text-blue-600   dark:text-blue-400',   border: 'border-blue-100   dark:border-blue-800/30' },
  green:  { bg: 'bg-green-50  dark:bg-green-900/20',  icon: 'text-green-600  dark:text-green-400',  border: 'border-green-100  dark:border-green-800/30' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', icon: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-100 dark:border-yellow-800/30' },
  red:    { bg: 'bg-red-50    dark:bg-red-900/20',    icon: 'text-red-600    dark:text-red-400',    border: 'border-red-100    dark:border-red-800/30' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-800/30' },
  cyan:   { bg: 'bg-cyan-50   dark:bg-cyan-900/20',   icon: 'text-cyan-600   dark:text-cyan-400',   border: 'border-cyan-100   dark:border-cyan-800/30' },
};

export function StatsCard({ title, value, icon: Icon, change, changeType = 'positive', color = 'blue' }) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.blue;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 tabular-nums">{value}</p>
          {change !== undefined && (
            <p className={cn(
              'text-xs mt-1.5 flex items-center gap-0.5',
              changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
            )}>
              <span aria-hidden="true">{changeType === 'positive' ? '↑' : '↓'}</span>
              <span>{change}</span>
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('p-3 rounded-xl border flex-shrink-0', c.bg, c.border)}>
            <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', c.icon)} aria-hidden="true" />
          </div>
        )}
      </div>
    </Card>
  );
}
