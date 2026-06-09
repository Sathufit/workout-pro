'use client';

import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input, Select } from '../../../components/ui/input';
import { Skeleton } from '../../../components/ui/skeleton';
import { formatDate } from '../../../lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Scale,
  Plus,
  X,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  HeartPulse,
  Ruler,
} from 'lucide-react';

type MetricType = 'WEIGHT' | 'HEIGHT' | 'BODY_FAT' | 'MUSCLE_MASS' | 'WAIST' | 'CHEST' | 'HIPS' | 'BMI';

const METRIC_CONFIG: Record<MetricType, { label: string; unit: string; icon: ReactNode; color: string }> = {
  WEIGHT: { label: 'Weight', unit: 'kg', icon: <Scale size={16} />, color: 'violet' },
  HEIGHT: { label: 'Height', unit: 'cm', icon: <Ruler size={16} />, color: 'blue' },
  BODY_FAT: { label: 'Body Fat', unit: '%', icon: <HeartPulse size={16} />, color: 'orange' },
  MUSCLE_MASS: { label: 'Muscle Mass', unit: 'kg', icon: <TrendingUp size={16} />, color: 'green' },
  WAIST: { label: 'Waist', unit: 'cm', icon: <Ruler size={16} />, color: 'pink' },
  CHEST: { label: 'Chest', unit: 'cm', icon: <Ruler size={16} />, color: 'indigo' },
  HIPS: { label: 'Hips', unit: 'cm', icon: <Ruler size={16} />, color: 'purple' },
  BMI: { label: 'BMI', unit: '', icon: <Scale size={16} />, color: 'teal' },
};

interface Metric {
  _id: string;
  type: MetricType;
  value: number;
  unit: string;
  recordedAt: string;
  note?: string;
}

export default function HealthPage() {
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedType, setSelectedType] = useState<MetricType>('WEIGHT');
  const qc = useQueryClient();

  const { data: latest, isLoading: latestLoading } = useQuery({
    queryKey: ['health-latest'],
    queryFn: () => api.get('/health/metrics/latest').then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['health-summary'],
    queryFn: () => api.get('/health/summary').then((r) => r.data),
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['health-metrics', selectedType],
    queryFn: () => api.get(`/health/metrics?type=${selectedType}&limit=30`).then((r) => r.data),
  });

  const chartData = metrics?.items?.map((m: Metric) => ({
    value: m.value,
    date: new Date(m.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  })).reverse() ?? [];

  const latestWeight = latest?.WEIGHT;
  const latestBodyFat = latest?.BODY_FAT;

  const bmi = summary?.currentBMI;
  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight'
    : bmi < 25 ? 'Normal'
    : bmi < 30 ? 'Overweight'
    : 'Obese'
    : null;
  const bmiVariant = bmi
    ? bmi < 18.5 ? 'info'
    : bmi < 25 ? 'success'
    : bmi < 30 ? 'warning'
    : 'danger'
    : 'default';

  const weightTrend = summary?.weightTrend7d;

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Health Metrics</h1>
        <Button size="sm" onClick={() => setShowLogForm(true)}>
          <Plus size={14} />
          Log
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {latestLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-3 w-1/2 mb-3" />
              <Skeleton className="h-7 w-1/3 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </Card>
          ))
        ) : (
          <>
            <OverviewCard
              label="Weight"
              value={latestWeight?.value != null ? `${latestWeight.value}` : '—'}
              unit="kg"
              trend={weightTrend}
              icon={<Scale size={17} className="text-violet-600" />}
            />
            <OverviewCard
              label="Body Fat"
              value={latestBodyFat?.value != null ? `${latestBodyFat.value}` : '—'}
              unit="%"
              icon={<HeartPulse size={17} className="text-orange-500" />}
            />
            <Card className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">BMI</p>
                <Scale size={17} className="text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">
                {bmi != null ? bmi.toFixed(1) : '—'}
              </p>
              {bmiCategory && (
                <Badge variant={bmiVariant as 'default' | 'success' | 'warning' | 'danger' | 'info'} className="mt-1.5">
                  {bmiCategory}
                </Badge>
              )}
            </Card>
            <OverviewCard
              label="7d trend"
              value={weightTrend != null ? `${weightTrend > 0 ? '+' : ''}${weightTrend.toFixed(1)}` : '—'}
              unit={weightTrend != null ? 'kg' : ''}
              icon={
                weightTrend == null ? <Minus size={17} className="text-slate-400" />
                : weightTrend <= 0 ? <TrendingDown size={17} className="text-emerald-600" />
                : <TrendingUp size={17} className="text-rose-500" />
              }
            />
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2 mb-3">
            <CardTitle>Trend</CardTitle>
          </div>
          {/* Horizontally scrollable type picker — no overflow on mobile */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-6 px-6 pb-0.5">
            {(Object.keys(METRIC_CONFIG) as MetricType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {METRIC_CONFIG[type].label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {metricsLoading ? (
            <Skeleton className="h-52 w-full" />
          ) : chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  width={40}
                />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v} ${METRIC_CONFIG[selectedType].unit}`, METRIC_CONFIG[selectedType].label]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#7c3aed"
                  strokeWidth={2.5}
                  dot={{ fill: '#7c3aed', r: 3.5 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-52 gap-3 text-center">
              <Scale size={32} className="text-slate-200" />
              <div>
                <p className="text-sm font-medium text-slate-600">No {METRIC_CONFIG[selectedType].label} data</p>
                <p className="text-xs text-slate-400 mt-0.5">Log at least 2 entries to see trends</p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setShowLogForm(true)}>
                Log {METRIC_CONFIG[selectedType].label}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {metricsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : metrics?.items?.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {metrics.items.slice(0, 10).map((m: Metric) => (
                <MetricRow key={m._id} metric={m} onDelete={() => qc.invalidateQueries({ queryKey: ['health-metrics', selectedType] })} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-sm text-slate-500">No {METRIC_CONFIG[selectedType].label} entries yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log form modal */}
      {showLogForm && (
        <LogMetricsModal
          onClose={() => setShowLogForm(false)}
          onLogged={() => {
            qc.invalidateQueries({ queryKey: ['health-latest'] });
            qc.invalidateQueries({ queryKey: ['health-summary'] });
            qc.invalidateQueries({ queryKey: ['health-metrics'] });
            setShowLogForm(false);
          }}
        />
      )}
    </div>
  );
}

function OverviewCard({ label, value, unit, trend, icon }: {
  label: string; value: string; unit: string; trend?: number; icon: ReactNode;
}) {
  return (
    <Card className="p-4 lg:p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
        {icon}
      </div>
      <p className="text-xl lg:text-2xl font-bold text-slate-900 tabular-nums leading-none">
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
      {trend != null && (
        <p className={`text-xs mt-1 ${trend <= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
          {trend > 0 ? '+' : ''}{trend.toFixed(1)} kg this week
        </p>
      )}
    </Card>
  );
}

function MetricRow({ metric, onDelete }: { metric: Metric; onDelete: () => void }) {
  const cfg = METRIC_CONFIG[metric.type] ?? { label: metric.type, unit: '', icon: null };
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/health/metrics/${metric._id}`),
    onSuccess: onDelete,
  });

  return (
    <div className="flex items-center justify-between py-3 first:pt-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
          {cfg.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">
            {metric.value} {metric.unit || cfg.unit}
          </p>
          <p className="text-xs text-slate-400">{formatDate(metric.recordedAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="default">{cfg.label}</Badge>
        <button
          onClick={() => deleteMutation.mutate()}
          className="p-1.5 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function LogMetricsModal({ onClose, onLogged }: { onClose: () => void; onLogged: () => void }) {
  const [type, setType] = useState<MetricType>('WEIGHT');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const cfg = METRIC_CONFIG[type];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) { setError('Please enter a valid positive number'); return; }
    setLoading(true);
    try {
      await api.post('/health/metrics', { type, value: num, unit: cfg.unit, note });
      onLogged();
    } catch {
      setError('Failed to log metric. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Log Metric</CardTitle>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}
            <Select
              label="Metric type"
              value={type}
              onChange={(e) => setType(e.target.value as MetricType)}
            >
              {(Object.entries(METRIC_CONFIG) as [MetricType, typeof METRIC_CONFIG[MetricType]][]).map(([key, c]) => (
                <option key={key} value={key}>{c.label}{c.unit ? ` (${c.unit})` : ''}</option>
              ))}
            </Select>
            <Input
              label={`Value${cfg.unit ? ` (${cfg.unit})` : ''}`}
              type="number"
              step="0.1"
              min="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={type === 'WEIGHT' ? 'e.g. 75.5' : type === 'HEIGHT' ? 'e.g. 178' : 'Enter value'}
            />
            <Input
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any notes about this entry"
            />
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" loading={loading}>Log metric</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
