/**
 * Loading skeleton components for improved perceived performance
 * Show placeholder content while data is loading
 */

export function GroupCardSkeleton() {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 animate-pulse">
      <div className="space-y-3">
        {/* Title */}
        <div className="h-5 bg-slate-600 rounded w-3/4"></div>
        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-slate-600 rounded"></div>
          <div className="h-3 bg-slate-600 rounded w-5/6"></div>
        </div>
        {/* Member count */}
        <div className="h-3 bg-slate-600 rounded w-1/3"></div>
      </div>
    </div>
  );
}

export function GroupListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <GroupCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChoreCardSkeleton() {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 animate-pulse">
      <div className="space-y-3">
        {/* Title */}
        <div className="h-4 bg-slate-600 rounded w-2/3"></div>
        {/* Details line 1 */}
        <div className="h-3 bg-slate-600 rounded w-1/2"></div>
        {/* Details line 2 */}
        <div className="h-3 bg-slate-600 rounded w-1/3"></div>
        {/* Action button placeholder */}
        <div className="h-8 bg-slate-600 rounded mt-3"></div>
      </div>
    </div>
  );
}

export function ChoreListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <ChoreCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 animate-pulse">
      <div className="flex gap-6">
        {/* Avatar */}
        <div className="w-32 h-32 bg-slate-700 rounded-full"></div>
        {/* Text content */}
        <div className="flex-1 space-y-3">
          <div className="h-8 bg-slate-700 rounded w-1/3"></div>
          <div className="h-4 bg-slate-700 rounded w-1/4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsCardSkeleton() {
  return (
    <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600 animate-pulse">
      <div className="space-y-4">
        {/* Title */}
        <div className="h-5 bg-slate-600 rounded w-2/3"></div>
        {/* Chart placeholder */}
        <div className="h-40 bg-slate-600 rounded"></div>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 bg-slate-600 rounded"></div>
          <div className="h-4 bg-slate-600 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <AnalyticsCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="bg-slate-700/50 rounded px-4 py-3 flex gap-4 animate-pulse">
        <div className="h-4 bg-slate-600 rounded flex-1"></div>
        <div className="h-4 bg-slate-600 rounded flex-1"></div>
        <div className="h-4 bg-slate-600 rounded flex-1"></div>
      </div>
      {/* Data rows */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-slate-700/50 rounded px-4 py-3 flex gap-4 animate-pulse">
          <div className="h-4 bg-slate-600 rounded flex-1"></div>
          <div className="h-4 bg-slate-600 rounded flex-1"></div>
          <div className="h-4 bg-slate-600 rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900/50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="h-10 bg-slate-700 rounded w-1/3 animate-pulse"></div>
        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg h-40 animate-pulse"></div>
            ))}
          </div>
          <div className="bg-slate-700/50 rounded-lg h-60 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
