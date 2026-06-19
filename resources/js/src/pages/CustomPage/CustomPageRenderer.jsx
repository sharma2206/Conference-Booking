import { useQuery } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { FileText, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import { Skeleton } from '../../components/ui/Skeleton';

function ComponentRenderer({ component }) {
  const cfg = component.config || {};

  if (component.type === 'html') {
    return (
      <div
        className="prose dark:prose-invert max-w-none text-gray-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: cfg.html || '' }}
      />
    );
  }

  if (component.type === 'card') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
        {cfg.title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{cfg.title}</h3>}
        {cfg.content && <p className="text-gray-600 dark:text-slate-300 leading-relaxed">{cfg.content}</p>}
      </div>
    );
  }

  if (component.type === 'stats') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(cfg.stats || []).map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    );
  }

  if (component.type === 'alert') {
    const colorMap = {
      info:    'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
      success: 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
      danger:  'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    };
    return (
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${colorMap[cfg.type || 'info']}`}>
        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm">{cfg.message}</p>
      </div>
    );
  }

  if (component.type === 'table') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          {cfg.title && <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{cfg.title}</h3>}
          {cfg.description && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{cfg.description}</p>}
        </div>
        <div className="p-5 text-sm text-gray-400 dark:text-slate-500 text-center py-8">Table data configured in admin panel</div>
      </div>
    );
  }

  return null;
}

export default function CustomPageRenderer() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['custom-page', slug],
    queryFn: () => api.get(`/pages?slug=${slug}`).then(r => {
      const d = r.data.data || r.data;
      const arr = Array.isArray(d) ? d : [];
      return arr.find(p => p.slug === slug && p.status === 'published') || null;
    }),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64">
        <FileText className="h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
        <p className="text-sm font-medium text-gray-400 dark:text-slate-500">Page not found</p>
        <p className="text-xs text-gray-300 dark:text-slate-600 mt-1">This page does not exist or is not published</p>
      </div>
    );
  }

  const components = Array.isArray(data.components) ? data.components : [];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.title}</h1>
        {data.meta_description && (
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{data.meta_description}</p>
        )}
      </div>

      {/* Components */}
      {components.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-slate-500">This page has no content yet</p>
        </div>
      ) : (
        <div className="space-y-5">
          {components.map(comp => (
            <ComponentRenderer key={comp.id || comp.type} component={comp} />
          ))}
        </div>
      )}
    </div>
  );
}
