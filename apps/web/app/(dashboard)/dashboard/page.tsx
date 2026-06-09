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
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Dumbbell, TrendingUp, TrendingDown, Flame, Scale,
  Plus, ChevronRight, Activity, Calendar,
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
  const weightData = (metrics?.items ?? []).map((m: { value: number; recordedAt: string }) => ({
    value: m.value,
    date: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).reverse();

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-5 lg:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-3xl font-bold text-slate-900 truncate">
            {greeting}{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href="/workouts" className="flex-shrink-0">
          <Button size="sm">
            <Plus size={15} />
            <span className="hidden sm:inline">Log workout</span>
            <span className="sm:hidden">Log</span>
          </Button>
        </Link>
      </div>

      {/* Stat cards — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statsLoading || summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="This week" value={stats?.sessionsThisWeek ?? 0} unit="sessions"
              icon={<Activity size={16} className="text-violet-600" />} />
            <StatCard label="Total" value={stats?.totalSessions ?? 0} unit="workouts"
              icon={<Dumbbell size={16} className="text-blue-600" />} />
            <StatCard label="Streak" value={stats?.currentStreak ?? 0} unit="days"
              icon={<Flame size={16} className="text-orange-500" />} />
            <StatCard
              label="Weight"
              value={weightTrend != null ? `${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)}` : '—'}
              unit={weightTrend != null ? 'kg 7d' : 'no data'}
              icon={
                weightTrend != null
                  ? weightTrend <= 0
                    ? <TrendingDown size={16} className="text-emerald-600" />
                    : <TrendingUp size={16} className="text-rose-500" />
                  : <Scale size={16} className="text-slate-400" />
              }
            />
          </>
        )}
      </div>

      {/* Recent sessions + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 lg:pb-4">
            <CardTitle>Recent Sessions</CardTitle>
            <Link href="/workouts" className="text-xs text-violet-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {sessionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (sessions?.items?.length ?? 0) > 0 ? (
              <div className="divide-y divide-slate-50">
                {sessions.items.map((s: { _id: string; name?: string; completedAt?: string; startedAt: string; sets?: unknown[] }) => (
                  <div key={s._id} className="flex items-center justify-between py-3 first:pt-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Dumbbell size={16} className="text-violet-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{s.name ?? 'Workout Session'}</p>
                        <p className="text-xs text-slate-500">{formatRelative(s.completedAt ?? s.startedAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-3">
                      <Badge variant={s.completedAt ? 'success' : 'warning'} className="text-[10px]">
                        {s.completedAt ? 'Done' : 'Active'}
                      </Badge>
                      <p className="text-xs text-slate-400">{s.sets?.length ?? 0} sets</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Dumbbell size={24} className="text-slate-300" />}
                title="No sessions yet"
                description="Start your first workout"
                action={<Link href="/workouts"><Button size="sm">Start workout</Button></Link>}
              />
            )}
          </CardContent>
        </Card>

        {/* Weight trend chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Weight Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {weightData.length > 1 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weightData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={32} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v} kg`, 'Weight']} />
                  <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={<Scale size={24} className="text-slate-300" />}
                title="No weight data"
                description="Log your weight in Health"
                action={<Link href="/health"><Button size="sm" variant="secondary">Log weight</Button></Link>}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 lg:gap-3">
            {[
              { label: 'New workout', href: '/workouts', icon: <Dumbbell size={18} />, color: 'bg-violet-50 text-violet-600' },
              { label: 'Log metrics', href: '/health', icon: <Scale size={18} />, color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Exercises', href: '/exercises', icon: <Activity size={18} />, color: 'bg-blue-50 text-blue-600' },
              { label: 'Nutrition', href: '/nutrition', icon: <Calendar size={18} />, color: 'bg-orange-50 text-orange-600' },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="flex flex-col items-center gap-2 p-3 lg:p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm active:scale-95 transition-all"
              >
                <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center ${a.color}`}>
                  {a.icon}
                </div>
                <span className="text-xs font-medium text-slate-700 text-center leading-tight">{a.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, unit, icon }: {
  label: string; value: string | number; unit: string; icon: ReactNode;
}) {
  return (
    <Card className="p-4 lg:p-5">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
        {icon}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{unit}</p>
    </Card>
  );
}

function EmptyState({ icon, title, description, action }: {
  icon: ReactNode; title: string; description: string; action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-center">
      {icon}
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      {action}
    </div>
  );
}
