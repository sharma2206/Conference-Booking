import { ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldOff className="h-10 w-10 text-red-500 dark:text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          403
        </h1>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-3">
          Access Denied
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
          You don't have permission to access this page.
          Contact your administrator if you believe this is an error.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
