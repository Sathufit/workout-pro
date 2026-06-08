'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: () => api.get('/workout/stats').then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['health-summary'],
    queryFn: () => api.get('/health/summary').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back{user?.name ? `, ${user.name}` : ''}
        </h2>
        <p className="text-gray-500 mt-1">Here&apos;s your overview for today</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          label="Workouts this week"
          value={stats?.sessionsThisWeek ?? 0}
          suffix="sessions"
          color="blue"
        />
        <StatCard
          label="Total sessions"
          value={stats?.totalSessions ?? 0}
          suffix="all time"
          color="green"
        />
        <StatCard
          label="Weight trend (7d)"
          value={
            summary?.weightTrend7d != null
              ? `${summary.weightTrend7d > 0 ? '+' : ''}${summary.weightTrend7d.toFixed(1)}`
              : 'No data'
          }
          suffix={summary?.weightTrend7d != null ? 'kg' : ''}
          color={summary?.weightTrend7d < 0 ? 'green' : 'red'}
        />
      </div>

      {/* Widget grid */}
      {dashboard?.widgets && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dashboard.widgets.map((widget: { id: string; type: string; data: unknown }) => (
            <WidgetCard key={widget.id} widget={widget} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, suffix, color,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  color: 'blue' | 'green' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className={`rounded-lg border p-6 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-2">
        {value}
        {suffix && <span className="text-base font-normal ml-1 opacity-70">{suffix}</span>}
      </p>
    </div>
  );
}

function WidgetCard({ widget }: { widget: { type: string; data: unknown } }) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        {widget.type.replace(/_/g, ' ')}
      </h3>
      <pre className="text-xs text-gray-600 overflow-auto">
        {JSON.stringify(widget.data, null, 2)}
      </pre>
    </div>
  );
}
