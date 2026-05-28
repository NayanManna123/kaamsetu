/**
 * Skeleton Loader Components
 * Animated shimmer placeholders for loading states
 */

export const JobCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-surface-100 p-4 animate-pulse">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1">
        <div className="h-5 bg-surface-200 rounded-lg w-3/4 mb-2" />
        <div className="h-4 bg-surface-100 rounded-lg w-1/2" />
      </div>
      <div className="h-6 bg-surface-200 rounded-lg w-16" />
    </div>
    <div className="flex gap-2 mb-3">
      <div className="h-4 bg-surface-100 rounded-lg w-20" />
      <div className="h-4 bg-surface-100 rounded-lg w-16" />
      <div className="h-4 bg-surface-100 rounded-lg w-14" />
    </div>
    <div className="flex gap-1.5 mb-3">
      <div className="h-5 bg-surface-100 rounded-full w-16" />
      <div className="h-5 bg-surface-100 rounded-full w-20" />
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-surface-50">
      <div className="h-6 bg-surface-100 rounded-full w-16" />
      <div className="h-9 bg-primary-100 rounded-xl w-20" />
    </div>
  </div>
);

export const WorkerCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-surface-100 p-4 animate-pulse">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-14 h-14 bg-surface-200 rounded-2xl" />
      <div className="flex-1">
        <div className="h-5 bg-surface-200 rounded-lg w-2/3 mb-2" />
        <div className="h-4 bg-surface-100 rounded-lg w-1/3" />
      </div>
      <div className="h-6 bg-surface-200 rounded-lg w-14" />
    </div>
    <div className="flex gap-1.5 mb-3">
      <div className="h-5 bg-surface-100 rounded-full w-16" />
      <div className="h-5 bg-surface-100 rounded-full w-20" />
    </div>
    <div className="h-10 bg-primary-50 rounded-xl w-full mt-3" />
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-surface-100 p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-surface-200 rounded-xl" />
      <div>
        <div className="h-4 bg-surface-100 rounded-lg w-16 mb-2" />
        <div className="h-7 bg-surface-200 rounded-lg w-12" />
      </div>
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-2xl border border-surface-100 p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-4 bg-surface-200 rounded-lg w-2/3 mb-2" />
            <div className="h-3 bg-surface-100 rounded-lg w-1/2" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const SkeletonLoader = { JobCardSkeleton, WorkerCardSkeleton, StatCardSkeleton, ListSkeleton };
export default SkeletonLoader;
