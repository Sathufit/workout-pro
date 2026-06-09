'use client';

import { type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth.store';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { StatSkeleton, Skeleton } from '../../../components/ui/skeleton';
import { formatRelative } from '../../../lib/utils';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Flame,
  Scale,
  Plus,
  ChevronRight,
  Activity,
  Calendar,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: () => api.get('/workout/stats').then((r) => r.data),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['health-summary'],
    queryFn: () => api.get('/health/summary').then((r) => r.data),
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['recent-sessions'],
    queryFn: () => api.get('/workout/sessions?limit=5').then((r) => r.data),
  });

  const { data: metrics } = useQuery({
    queryKey: ['weight-metrics'],
    queryFn: () => api.get('/health/metrics?type=WEIGHT&limit=14').then((r) => r.data),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const weightTrend = summary?.weightTrend7d;
  const weightData = metrics?.items?.map((m: { value: number; recordedAt: string }) => ({
    value: m.value,
    date: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).reverse() ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/workouts">
          <Button size="md">
            <Plus size={16} />
            Log workout
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading || summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              label="This week"
              value={stats?.sessionsThisWeek ?? 0}
              unit="sessions"
              icon={<Activity size={18} className="text-violet-600" />}
              accent="violet"
            />
            <StatCard
              label="Total workouts"
              value={stats?.totalSessions ?? 0}
              unit="all time"
              icon={<Dumbbell size={18} className="text-blue-600" />}
              accent="blue"
            />
            <StatCard
              label="Current streak"
              value={stats?.currentStreak ?? 0}
              unit="days"
              icon={<Flame size={18} className="text-orange-500" />}
              accent="orange"
            />
            <StatCard
              label="Weight trend"
              value={
                weightTrend != null
                  ? `${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)}`
                  : '—'
              }
              unit={weightTrend != null ? 'kg (7d)' : 'no data'}
              icon={
                weightTrend != null ? (
                  weightTrend <= 0
                    ? <TrendingDown size={18} className="text-emerald-600" />
                    : <TrendingUp size={18} className="text-rose-500" />
                ) : (
                  <Scale size={18} className="text-slate-400" />
                )
              }
              accent={weightTrend != null && weightTrend <= 0 ? 'green' : 'red'}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent sessions */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/workouts" className="text-xs text-violet-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : sessions?.items?.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {sessions.items.map((s: {
                  _id: string;
                  name?: string;
                  completedAt?: string;
                  startedAt: string;
                  sets?: unknown[];
                }) => (
                  <div key={s._id} className="flex items-center justify-between py-3 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Dumbbell size={16} className="text-violet-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{s.name ?? 'Workout Session'}</p>
                        <p className="text-xs text-slate-500">{formatRelative(s.completedAt ?? s.startedAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={s.completedAt ? 'success' : 'warning'}>
                        {s.completedAt ? 'Completed' : 'In progress'}
                      </Badge>
                      <p className="text-xs text-slate-400 mt-1">{s.sets?.length ?? 0} sets</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Dumbbell size={28} className="text-slate-300" />}
                title="No sessions yet"
                description="Start your first workout to see it here"
                action={<Link href="/workouts"><Button size="sm">Start workout</Button></Link>}
              />
            )}
          </CardContent>
        </Card>

        {/* Weight trend chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {weightData.length > 1 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weightData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                    width={35}
                  />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`${v} kg`, 'Weight']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={<Scale size={28} className="text-slate-300" />}
                title="No weight data"
                description="Log your weight in Health to see trends"
                action={<Link href="/health"><Button size="sm" variant="secondary">Log weight</Button></Link>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'New workout', href: '/workouts', icon: <Dumbbell size={20} />, color: 'bg-violet-50 text-violet-600' },
              { label: 'Log metrics', href: '/health', icon: <Scale size={20} />, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Browse exercises', href: '/exercises', icon: <Activity size={20} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'View schedule', href: '/workouts', icon: <Calendar size={20} />, color: 'bg-orange-50 text-orange-600' },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.color} group-hover:scale-110 transition-transform`}>
                  {a.icon}
                </div>
                <span className="text-xs font-medium text-slate-700">{a.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label, value, unit, icon, accent,
}: {
  label: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        {icon}
      </div>
      <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{unit}</p>
    </Card>
  );
}

function EmptyState({
  icon, title, description, action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      {icon}
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      {action}
    </div>
  );
}
