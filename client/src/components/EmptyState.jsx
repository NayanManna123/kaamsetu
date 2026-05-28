import { Search as SearchIcon } from 'lucide-react';

/**
 * Empty State Component
 * Shown when no data is available
 */
const EmptyState = ({ icon: Icon = SearchIcon, title = 'Nothing here yet', message = '', action, actionLabel }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-100 flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-surface-300" />
      </div>
      <h3 className="text-lg font-semibold text-surface-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-surface-400 max-w-xs mb-4">{message}</p>}
      {action && (
        <button onClick={action} className="btn-primary text-sm">
          {actionLabel || 'Get Started'}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
