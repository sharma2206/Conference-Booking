import { cn } from '../../lib/utils';

/**
 * Tab bar with underline indicator style.
 * Usage:
 *   <Tabs tabs={[{id:'a',label:'Tab A'}, ...]} active={tab} onChange={setTab} />
 */
export function Tabs({ tabs, active, onChange, className }) {
  return (
    <div
      role="tablist"
      aria-label="Tabs"
      className={cn(
        'flex gap-1 border-b border-gray-200 dark:border-slate-700 overflow-x-auto scrollbar-none',
        className,
      )}
    >
      {tabs.map(({ id, label, icon: Icon, badge }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          aria-controls={`tabpanel-${id}`}
          id={`tab-${id}`}
          onClick={() => onChange(id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
            active === id
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-300 dark:hover:border-slate-600',
          )}
        >
          {Icon && <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />}
          {label}
          {badge !== undefined && (
            <span className={cn(
              'ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
              active === id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300',
            )}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, active, children, className }) {
  if (active !== id) return null;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      className={cn('focus:outline-none', className)}
    >
      {children}
    </div>
  );
}

/**
 * Pill-style tabs (for compact use inside cards, etc.)
 */
export function PillTabs({ tabs, active, onChange, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 p-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl',
        className,
      )}
    >
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          role="tab"
          aria-selected={active === id}
          onClick={() => onChange(id)}
          className={cn(
            'flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
            active === id
              ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
