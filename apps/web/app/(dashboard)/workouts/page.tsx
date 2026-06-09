'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { CardSkeleton, Skeleton } from '../../../components/ui/skeleton';
import { formatRelative } from '../../../lib/utils';
import {
  Dumbbell,
  Plus,
  Play,
  MoreHorizontal,
  Calendar,
  Layers,
  ChevronRight,
  X,
  CheckCircle2,
  Circle,
  Search,
  Trash2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Exercise {
  _id: string;
  name: string;
  category: string;
  difficulty: string;
  primaryMuscles: string[];
  equipment: string[];
  images?: string[];
  imageUrl?: string;
}

interface PlanExercise {
  exerciseId: string;
  exerciseName?: string;
  order?: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  restSeconds?: number;
  notes?: string;
}

interface WorkoutPlan {
  _id: string;
  name: string;
  description?: string;
  scheduleDays?: number[];
  exercises?: PlanExercise[];
  isTemplate?: boolean;
}

interface WorkoutSet {
  exerciseId: string;
  exerciseName?: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  rpe?: number;
  completedAt: string;
}

interface WorkoutSession {
  _id: string;
  name?: string;
  planId?: string;
  startedAt: string;
  completedAt?: string;
  sets?: WorkoutSet[];
}

const PAGE_SIZE = 12;

export default function WorkoutsPage() {
  const [tab, setTab] = useState<'plans' | 'sessions'>('plans');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [managingPlan, setManagingPlan] = useState<WorkoutPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<WorkoutPlan | null>(null);
  const [loggingSession, setLoggingSession] = useState<WorkoutSession | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const qc = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['workout-plans'],
    queryFn: () => api.get('/workout/plans').then((r) => r.data),
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['workout-sessions'],
    queryFn: () => api.get('/workout/sessions').then((r) => r.data),
    enabled: tab === 'sessions',
  });

  const createSession = useMutation({
    mutationFn: (planId?: string) =>
      api.post('/workout/sessions', { planId, name: planId ? undefined : 'Quick Session' }).then((r) => r.data),
    onSuccess: (newSession: WorkoutSession) => {
      qc.invalidateQueries({ queryKey: ['workout-sessions'] });
      qc.invalidateQueries({ queryKey: ['recent-sessions'] });
      qc.invalidateQueries({ queryKey: ['workout-stats'] });
      setTab('sessions');
      setLoggingSession(newSession);
    },
  });

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/workout/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plans'] }),
  });

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Workouts</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => createSession.mutate(undefined)} loading={createSession.isPending}>
            <Play size={14} />
            <span className="hidden sm:inline">Quick start</span>
          </Button>
          <Button size="sm" onClick={() => setShowCreatePlan(true)}>
            <Plus size={14} />
            <span className="hidden sm:inline">New plan</span>
            <span className="sm:hidden">Plan</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['plans', 'sessions'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize min-h-[2.25rem] ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Plans */}
      {tab === 'plans' && (
        plansLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
          </div>
        ) : plans?.items?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {plans.items.map((plan: WorkoutPlan) => (
              <PlanCard
                key={plan._id}
                plan={plan}
                onView={() => setViewingPlan(plan)}
                onStart={() => createSession.mutate(plan._id)}
                onManage={() => setManagingPlan(plan)}
                onDelete={() => deletePlan.mutate(plan._id)}
                starting={createSession.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyPlans onCreateClick={() => setShowCreatePlan(true)} />
        )
      )}

      {/* Sessions */}
      {tab === 'sessions' && (
        sessionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : sessions?.items?.length > 0 ? (
          <div className="space-y-3">
            {sessions.items.map((s: WorkoutSession) => (
              <SessionRow
                key={s._id}
                session={s}
                onOpen={s.completedAt ? () => setViewingSession(s) : () => setLoggingSession(s)}
              />
            ))}
          </div>
        ) : (
          <EmptySessions onStartClick={() => createSession.mutate(undefined)} />
        )
      )}

      {/* Modals */}
      {showCreatePlan && (
        <CreatePlanModal
          onClose={() => setShowCreatePlan(false)}
          onCreated={(plan) => {
            qc.invalidateQueries({ queryKey: ['workout-plans'] });
            setShowCreatePlan(false);
            setManagingPlan(plan);
          }}
        />
      )}

      {managingPlan && (
        <ManagePlanModal
          plan={managingPlan}
          onClose={() => {
            setManagingPlan(null);
            qc.invalidateQueries({ queryKey: ['workout-plans'] });
          }}
        />
      )}

      {loggingSession && (
        <SessionLoggerModal
          session={loggingSession}
          onClose={() => {
            setLoggingSession(null);
            qc.invalidateQueries({ queryKey: ['workout-sessions'] });
            qc.invalidateQueries({ queryKey: ['recent-sessions'] });
            qc.invalidateQueries({ queryKey: ['workout-stats'] });
          }}
        />
      )}

      {viewingSession && (
        <SessionDetailModal session={viewingSession} onClose={() => setViewingSession(null)} />
      )}

      {viewingPlan && (
        <PlanDetailModal
          plan={viewingPlan}
          onClose={() => setViewingPlan(null)}
          onStart={() => { createSession.mutate(viewingPlan._id); setViewingPlan(null); }}
          onManage={() => { setManagingPlan(viewingPlan); setViewingPlan(null); }}
        />
      )}
    </div>
  );
}

function PlanCard({ plan, onView, onStart, onManage, onDelete, starting }: {
  plan: WorkoutPlan; onView: () => void; onStart: () => void; onManage: () => void; onDelete: () => void; starting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Card className="hover:shadow-md transition-shadow relative cursor-pointer" onClick={onView}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} className="text-violet-600" />
          </div>
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-10 w-40">
                <button onClick={() => { setMenuOpen(false); onManage(); }} className="w-full text-left px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 min-h-[2.75rem] flex items-center">
                  Edit exercises
                </button>
                <button onClick={() => { setMenuOpen(false); onDelete(); }} className="w-full text-left px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 min-h-[2.75rem] flex items-center">
                  Delete plan
                </button>
              </div>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-slate-900 mb-1">{plan.name}</h3>
        {plan.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{plan.description}</p>}

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Layers size={12} />{plan.exercises?.length ?? 0} exercises
          </span>
          {plan.scheduleDays && plan.scheduleDays.length > 0 && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />{plan.scheduleDays.length}d/week
            </span>
          )}
        </div>

        {plan.scheduleDays && plan.scheduleDays.length > 0 && (
          <div className="flex gap-1 mb-4">
            {DAYS.map((d, i) => (
              <span
                key={d}
                className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-medium ${
                  plan.scheduleDays!.includes(i + 1) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {d[0]}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="flex-1" onClick={onManage}>
            Edit
          </Button>
          <Button size="sm" className="flex-1" onClick={onStart} loading={starting}>
            <Play size={13} /> Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRow({ session, onOpen }: { session: WorkoutSession; onOpen?: () => void }) {
  const done = !!session.completedAt;
  const setCount = session.sets?.length ?? 0;
  const exCount = new Set(session.sets?.map((s) => s.exerciseId)).size;
  return (
    <Card
      className="cursor-pointer hover:shadow-md active:scale-[0.99] transition-all"
      onClick={onOpen}
    >
      <div className="flex items-center gap-4 px-5 py-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          {done ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-amber-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm">{session.name ?? 'Workout Session'}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatRelative(session.completedAt ?? session.startedAt)}
            {setCount > 0 && ` · ${setCount} sets`}
            {exCount > 0 && ` · ${exCount} exercises`}
          </p>
        </div>
        <Badge variant={done ? 'success' : 'warning'}>{done ? 'Completed' : 'In progress'}</Badge>
        <ChevronRight size={16} className={`flex-shrink-0 ${done ? 'text-slate-300' : 'text-violet-400'}`} />
      </div>
    </Card>
  );
}

/* ─── Create Plan Modal ─────────────────────────────────────────────────── */
function CreatePlanModal({ onClose, onCreated }: { onClose: () => void; onCreated: (plan: WorkoutPlan) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDay = (day: number) =>
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Plan name is required'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/workout/plans', { name, description, scheduleDays: selectedDays });
      onCreated(data);
    } catch {
      setError('Failed to create plan. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="Create Workout Plan" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}
        <Input label="Plan name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Push Day, Full Body" />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            rows={2}
            placeholder="Brief description"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700">Schedule days</label>
          <div className="flex gap-1.5">
            {DAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(i + 1)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                  selectedDays.includes(i + 1) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {d[0]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" loading={loading}>Create &amp; add exercises</Button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Manage Plan Modal (with Exercise Picker) ─────────────────────────── */
function ManagePlanModal({ plan, onClose }: { plan: WorkoutPlan; onClose: () => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const qc = useQueryClient();

  const { data: planData, isLoading } = useQuery({
    queryKey: ['workout-plan', plan._id],
    queryFn: () => api.get(`/workout/plans/${plan._id}`).then((r) => r.data),
  });

  const removeExercise = useMutation({
    mutationFn: (exerciseId: string) => api.delete(`/workout/plans/${plan._id}/exercises/${exerciseId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-plan', plan._id] }),
  });

  const exercises: PlanExercise[] = planData?.exercises ?? [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">{plan.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{exercises.length} exercises in this plan</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : exercises.length > 0 ? (
            exercises.map((ex, idx) => (
              <div key={ex.exerciseId + idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{ex.exerciseName ?? 'Exercise'}</p>
                  <p className="text-xs text-slate-500">
                    {[
                      ex.targetSets && `${ex.targetSets} sets`,
                      ex.targetReps && `${ex.targetReps} reps`,
                      ex.targetWeight && `${ex.targetWeight} kg`,
                      ex.restSeconds && `${ex.restSeconds}s rest`,
                    ].filter(Boolean).join(' · ') || 'No targets set'}
                  </p>
                </div>
                <button
                  onClick={() => removeExercise.mutate(ex.exerciseId)}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Dumbbell size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-700">No exercises added yet</p>
              <p className="text-sm text-slate-400 mt-1">Add exercises from the library below</p>
            </div>
          )}
        </div>

        <div className="p-5 pb-safe border-t border-slate-100 flex gap-2 flex-shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Done</Button>
          <Button className="flex-1" onClick={() => setShowPicker(true)}>
            <Plus size={14} /> Add exercise
          </Button>
        </div>
      </div>

      {showPicker && (
        <ExercisePicker
          planId={plan._id}
          onClose={() => {
            setShowPicker(false);
            qc.invalidateQueries({ queryKey: ['workout-plan', plan._id] });
          }}
        />
      )}
    </div>
  );
}

/* ─── Exercise Picker ───────────────────────────────────────────────────── */
function ExercisePicker({ planId, onClose }: { planId: string; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [rest, setRest] = useState('60');
  const [loading, setLoading] = useState(false);
  const [expandedInstructions, setExpandedInstructions] = useState(false);

  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
    ...(debouncedSearch && { search: debouncedSearch }),
  });

  const { data } = useQuery({
    queryKey: ['exercise-picker', debouncedSearch, page],
    queryFn: () => api.get(`/exercises?${params}`).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const exercises: Exercise[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
    setTimeout(() => setDebouncedSearch(v), 400);
  };

  const handleAdd = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await api.post(`/workout/plans/${planId}/exercises`, {
        exerciseId: selected._id,
        exerciseName: selected.name,
        targetSets: sets ? parseInt(sets) : undefined,
        targetReps: reps ? parseInt(reps) : undefined,
        targetWeight: weight ? parseFloat(weight) : undefined,
        restSeconds: rest ? parseInt(rest) : 60,
      });
      onClose();
    } catch {
      // continue
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 60 }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-900">Add Exercise to Plan</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {!selected ? (
          <>
            {/* Search */}
            <div className="p-4 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
                  placeholder="Search exercises..."
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {exercises.map((ex) => {
                const img = ex.images?.[0] ?? ex.imageUrl;
                return (
                  <button
                    key={ex._id}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setSelected(ex)}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={ex.name} className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <Dumbbell size={20} className="text-violet-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{ex.name}</p>
                      <p className="text-xs text-slate-500 capitalize mt-0.5">
                        {ex.primaryMuscles?.slice(0, 2).join(', ')}
                      </p>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full capitalize">{ex.category.toLowerCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                          ex.difficulty === 'BEGINNER' ? 'bg-emerald-50 text-emerald-700'
                            : ex.difficulty === 'INTERMEDIATE' ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}>{ex.difficulty.toLowerCase()}</span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-shrink-0">
                <p className="text-xs text-slate-400">{total} exercises · page {page}/{totalPages}</p>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft size={13} />
                  </Button>
                  <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight size={13} />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Configure exercise */
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Selected exercise preview */}
              <div className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                {(selected.images?.[0] ?? selected.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.images?.[0] ?? selected.imageUrl} alt={selected.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={24} className="text-violet-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{selected.name}</p>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">{selected.primaryMuscles?.slice(0, 2).join(', ')}</p>
                  <button onClick={() => setSelected(null)} className="text-xs text-violet-600 mt-1 hover:underline">
                    ← Change exercise
                  </button>
                </div>
              </div>

              {/* Targets */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Set Targets</h4>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Sets" type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="3" />
                  <Input label="Reps" type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="10" />
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <Input label="Weight (kg)" type="number" min="0" step="any" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 52.25" />
                  <Input label="Rest (sec)" type="number" min="0" value={rest} onChange={(e) => setRest(e.target.value)} placeholder="60" />
                </div>
              </div>

              {/* Quick presets */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Quick presets</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '3×10', sets: '3', reps: '10' },
                    { label: '4×8', sets: '4', reps: '8' },
                    { label: '5×5', sets: '5', reps: '5' },
                    { label: '3×12', sets: '3', reps: '12' },
                    { label: '3×15', sets: '3', reps: '15' },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() => { setSets(p.sets); setReps(p.reps); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions preview */}
              {selected && (
                <ExerciseInstructionsPreview exercise={selected} expanded={expandedInstructions} onToggle={() => setExpandedInstructions((v) => !v)} />
              )}
            </div>
          </div>
        )}

        {selected && (
          <div className="p-5 pb-safe border-t border-slate-100 flex gap-2 flex-shrink-0">
            <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Back</Button>
            <Button className="flex-1" loading={loading} onClick={handleAdd}>
              <Plus size={14} /> Add to plan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Session Logger ────────────────────────────────────────────────────── */
function SessionLoggerModal({ session, onClose }: { session: WorkoutSession; onClose: () => void }) {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [activeExercise, setActiveExercise] = useState<{ id: string; name: string; targetSets?: number; targetReps?: number; targetWeight?: number } | null>(null);
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');

  const { data: sessionData, refetch } = useQuery({
    queryKey: ['session-live', session._id],
    queryFn: () => api.get(`/workout/sessions/${session._id}`).then((r) => r.data as WorkoutSession),
    refetchInterval: 8000,
  });

  // Load plan if this session was started from a plan
  const { data: plan } = useQuery({
    queryKey: ['workout-plan', session.planId],
    queryFn: () => api.get(`/workout/plans/${session.planId}`).then((r) => r.data),
    enabled: !!session.planId,
  });

  const { data: searchData } = useQuery({
    queryKey: ['ex-search-live', debouncedSearch],
    queryFn: () => api.get(`/exercises?search=${encodeURIComponent(debouncedSearch)}&limit=8`).then((r) => r.data),
    enabled: debouncedSearch.trim().length > 1,
    placeholderData: (p) => p,
  });

  const logSet = useMutation({
    mutationFn: (body: object) => api.post(`/workout/sessions/${session._id}/sets`, body),
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ['workout-stats'] }); },
  });

  const completeSession = useMutation({
    mutationFn: () => api.patch(`/workout/sessions/${session._id}`, {}),
    onSuccess: () => onClose(),
  });

  const deleteSession = useMutation({
    mutationFn: () => api.delete(`/workout/sessions/${session._id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-sessions'] });
      qc.invalidateQueries({ queryKey: ['recent-sessions'] });
      qc.invalidateQueries({ queryKey: ['workout-stats'] });
      onClose();
    },
  });

  const sets: WorkoutSet[] = sessionData?.sets ?? [];
  const isCompleted = !!sessionData?.completedAt;
  const planExercises: PlanExercise[] = plan?.exercises ?? [];

  const getSetsFor = (id: string) => sets.filter((s) => s.exerciseId === id);
  const getNextSetNum = (id: string) => getSetsFor(id).length + 1;
  const getLastWeight = (id: string) => {
    const prev = getSetsFor(id).filter((s) => s.weight != null);
    return prev.length ? String(prev[prev.length - 1].weight) : '';
  };

  // Extra exercises logged that aren't part of the plan
  const extraGroups = useMemo(() => {
    const planIds = new Set(planExercises.map((e) => e.exerciseId));
    const map = new Map<string, { name: string; sets: WorkoutSet[] }>();
    for (const s of sets) {
      if (!planIds.has(s.exerciseId)) {
        if (!map.has(s.exerciseId)) map.set(s.exerciseId, { name: s.exerciseName ?? 'Exercise', sets: [] });
        map.get(s.exerciseId)!.sets.push(s);
      }
    }
    return [...map.entries()].map(([id, g]) => ({ id, ...g }));
  }, [planExercises, sets]);

  // Total unique exercises for header
  const totalExercises = planExercises.length > 0
    ? planExercises.length + extraGroups.length
    : extraGroups.length;

  const openLogger = (id: string, name: string, target?: { targetSets?: number; targetReps?: number; targetWeight?: number }) => {
    setActiveExercise({ id, name, ...target });
    setSearchQuery(''); setDebouncedSearch(''); setShowResults(false);
    setWeight(getLastWeight(id) || (target?.targetWeight ? String(target.targetWeight) : ''));
    setReps(String(target?.targetReps ?? 10));
  };

  const handleSelectFromSearch = (ex: Exercise) => {
    openLogger(ex._id, ex.name);
  };

  const handleLogSet = () => {
    if (!activeExercise) return;
    logSet.mutate({
      exerciseId: activeExercise.id,
      exerciseName: activeExercise.name,
      setNumber: getNextSetNum(activeExercise.id),
      reps: reps ? parseInt(reps, 10) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0 pt-safe">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-2 -ml-1 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900 text-sm truncate">{sessionData?.name ?? session.name}</h2>
            <p className="text-xs text-slate-400">
              {totalExercises} exercise{totalExercises !== 1 ? 's' : ''} · {sets.length} sets logged
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isCompleted && (
            <>
              <button
                onClick={() => deleteSession.mutate()}
                disabled={deleteSession.isPending}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                title="Delete session"
              >
                <Trash2 size={17} />
              </button>
              <Button size="sm" variant="outline" onClick={() => completeSession.mutate()} loading={completeSession.isPending}>
                <CheckCircle2 size={14} /> Finish
              </Button>
            </>
          )}
          {isCompleted && <Badge variant="success">Completed</Badge>}
        </div>
      </div>

      {/* Sticky search */}
      {!isCompleted && (
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
              placeholder="Search to add an exercise…"
              value={searchQuery}
              onChange={(e) => { const v = e.target.value; setSearchQuery(v); setShowResults(true); setTimeout(() => setDebouncedSearch(v), 350); }}
              onFocus={() => setShowResults(true)}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setShowResults(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400">
                <X size={14} />
              </button>
            )}
          </div>
          {showResults && debouncedSearch.trim().length > 1 && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {(searchData?.items ?? []).slice(0, 6).map((ex: Exercise) => (
                <button key={ex._id} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 active:bg-violet-100 transition-colors text-left border-b border-slate-50 last:border-0" onClick={() => handleSelectFromSearch(ex)}>
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={14} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{ex.name}</p>
                    {ex.primaryMuscles?.length > 0 && <p className="text-xs text-slate-400 capitalize">{ex.primaryMuscles.slice(0, 2).join(' · ')}</p>}
                  </div>
                  <Plus size={15} className="text-violet-400 flex-shrink-0" />
                </button>
              ))}
              {(searchData?.items ?? []).length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">No exercises found</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Active set-logger */}
        {activeExercise && !isCompleted && (
          <div className="mx-4 mt-4 bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Now logging</p>
                <p className="font-semibold text-slate-900 truncate">{activeExercise.name}</p>
                {(activeExercise.targetSets || activeExercise.targetReps) && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: {activeExercise.targetSets && `${activeExercise.targetSets} sets`}
                    {activeExercise.targetReps && ` × ${activeExercise.targetReps} reps`}
                    {activeExercise.targetWeight && ` @ ${activeExercise.targetWeight} kg`}
                  </p>
                )}
              </div>
              <button onClick={() => setActiveExercise(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex-shrink-0">
                <X size={16} />
              </button>
            </div>
            {getSetsFor(activeExercise.id).length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Logged so far</p>
                <div className="space-y-1">
                  {getSetsFor(activeExercise.id).map((s) => (
                    <div key={s.setNumber} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.setNumber}</span>
                      <span className="text-slate-600">{s.reps ?? '—'} reps</span>
                      {s.weight != null && <span className="text-slate-700 font-medium">@ {s.weight} kg</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="px-4 py-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Set {getNextSetNum(activeExercise.id)}</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input label="Reps" type="number" inputMode="numeric" min="1" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="10" />
                <Input label="Weight (kg)" type="number" inputMode="decimal" step="any" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 52.25" />
              </div>
              <Button className="w-full" onClick={handleLogSet} loading={logSet.isPending} disabled={!reps && !weight}>
                Log set {getNextSetNum(activeExercise.id)}
              </Button>
            </div>
          </div>
        )}

        {/* Plan exercises guide */}
        {planExercises.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              {plan?.name ?? 'Plan'} · {planExercises.length} exercises
            </p>
            <div className="space-y-2">
              {planExercises.map((ex) => {
                const logged = getSetsFor(ex.exerciseId);
                const done = ex.targetSets ? logged.length >= ex.targetSets : logged.length > 0;
                const isActive = activeExercise?.id === ex.exerciseId;
                return (
                  <button
                    key={ex.exerciseId}
                    disabled={isCompleted}
                    onClick={() => !isCompleted && openLogger(ex.exerciseId, ex.exerciseName ?? 'Exercise', ex)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isActive ? 'border-violet-300 bg-violet-50' :
                      done ? 'border-emerald-100 bg-emerald-50/60' :
                      'border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/50 active:bg-violet-50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${done ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                      {done ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Dumbbell size={16} className="text-violet-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{ex.exerciseName ?? 'Exercise'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[
                          ex.targetSets && `${ex.targetSets} sets`,
                          ex.targetReps && `${ex.targetReps} reps`,
                          ex.targetWeight && `${ex.targetWeight} kg`,
                        ].filter(Boolean).join(' × ')}
                        {logged.length > 0 && ` · ${logged.length} logged`}
                      </p>
                    </div>
                    {!isCompleted && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${
                        done ? 'text-emerald-700 bg-emerald-100' :
                        logged.length > 0 ? 'text-violet-700 bg-violet-100' :
                        'text-slate-400 bg-slate-100'
                      }`}>
                        {done ? 'Done' : logged.length > 0 ? `${logged.length}/${ex.targetSets ?? '?'}` : 'Start'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Extra exercises (not in plan) */}
        {extraGroups.length > 0 && (
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Extra exercises</p>
            <div className="space-y-2">
              {extraGroups.map((group) => (
                <button key={group.id} disabled={isCompleted}
                  onClick={() => !isCompleted && openLogger(group.id, group.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white hover:border-violet-200 hover:bg-violet-50/50 transition-all text-left active:bg-violet-50"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={16} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{group.name}</p>
                    <p className="text-xs text-slate-400">{group.sets.length} sets</p>
                  </div>
                  {!isCompleted && <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state (quick session, nothing logged yet) */}
        {planExercises.length === 0 && extraGroups.length === 0 && !isCompleted && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
              <Dumbbell size={28} className="text-violet-300" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">Ready to log</p>
              <p className="text-sm text-slate-400 mt-1">Search for an exercise above to start</p>
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-8">
            <CheckCircle2 size={36} className="text-emerald-500" />
            <div>
              <p className="font-semibold text-slate-800">Workout Complete!</p>
              <p className="text-sm text-slate-500 mt-1">{sets.length} sets · {totalExercises} exercises</p>
            </div>
            <Button variant="secondary" onClick={onClose}>Back to sessions</Button>
          </div>
        )}

        <div className="pb-safe h-6" />
      </div>
    </div>
  );
}

function ExerciseInstructionsPreview({ exercise, expanded, onToggle }: {
  exercise: Exercise; expanded: boolean; onToggle: () => void;
}) {
  const { data } = useQuery({
    queryKey: ['exercise-detail', exercise._id],
    queryFn: () => api.get(`/exercises/${exercise._id}`).then((r) => r.data),
  });

  const instructions: string[] = data?.instructions ?? [];
  if (instructions.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? 'Hide' : 'Show'} instructions ({instructions.length} steps)
      </button>
      {expanded && (
        <div className="mt-3 space-y-2.5">
          {instructions.map((step, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Plan Detail Modal ─────────────────────────────────────────────────── */
function PlanDetailModal({ plan, onClose, onStart, onManage }: {
  plan: WorkoutPlan; onClose: () => void; onStart: () => void; onManage: () => void;
}) {
  const { data: planData, isLoading } = useQuery({
    queryKey: ['workout-plan', plan._id],
    queryFn: () => api.get(`/workout/plans/${plan._id}`).then((r) => r.data),
  });

  const exercises: PlanExercise[] = planData?.exercises ?? [];

  // Fetch image + muscle info for each exercise in parallel
  const detailQueries = useQueries({
    queries: exercises.map((ex) => ({
      queryKey: ['exercise-detail', ex.exerciseId],
      queryFn: () => api.get(`/exercises/${ex.exerciseId}`).then((r) => r.data as Exercise),
      enabled: !!ex.exerciseId,
      staleTime: 10 * 60 * 1000,
    })),
  });

  const detailMap = exercises.reduce<Record<string, Exercise | undefined>>((acc, ex, i) => {
    acc[ex.exerciseId] = detailQueries[i]?.data;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="font-bold text-slate-900 text-lg leading-tight">{plan.name}</h2>
            {plan.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{plan.description}</p>}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Layers size={11} />{exercises.length} exercises</span>
              {plan.scheduleDays && plan.scheduleDays.length > 0 && (
                <span className="flex items-center gap-1"><Calendar size={11} />{plan.scheduleDays.length} days/week</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Schedule days */}
        {plan.scheduleDays && plan.scheduleDays.length > 0 && (
          <div className="flex gap-1.5 px-6 py-3 border-b border-slate-100 flex-shrink-0">
            {DAYS.map((d, i) => (
              <span key={d} className={`flex-1 py-1.5 rounded-lg text-xs font-medium text-center ${plan.scheduleDays!.includes(i + 1) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                {d[0]}
              </span>
            ))}
          </div>
        )}

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : exercises.length > 0 ? (
            exercises.map((ex, idx) => {
              const detail = detailMap[ex.exerciseId];
              const img = detail?.images?.[0] ?? detail?.imageUrl;
              return (
                <div key={ex.exerciseId} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-violet-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={ex.exerciseName ?? ''} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Dumbbell size={22} className="text-violet-400" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-slate-400">{idx + 1}</span>
                      <p className="font-semibold text-slate-900 text-sm truncate">{ex.exerciseName ?? 'Exercise'}</p>
                    </div>
                    {detail?.primaryMuscles && detail.primaryMuscles.length > 0 && (
                      <p className="text-xs text-slate-400 capitalize mb-1.5">{detail.primaryMuscles.slice(0, 2).join(' · ')}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {ex.targetSets && (
                        <span className="text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{ex.targetSets} sets</span>
                      )}
                      {ex.targetReps && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ex.targetReps} reps</span>
                      )}
                      {ex.targetWeight && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ex.targetWeight} kg</span>
                      )}
                      {ex.restSeconds && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ex.restSeconds}s rest</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <Dumbbell size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No exercises added yet</p>
              <button onClick={onManage} className="text-sm text-violet-600 hover:underline mt-1">Add exercises →</button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 pb-safe border-t border-slate-100 flex-shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onManage}>Edit plan</Button>
          <Button className="flex-1" onClick={onStart} disabled={exercises.length === 0}>
            <Play size={14} /> Start workout
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Session Detail Modal ──────────────────────────────────────────────── */
function SessionDetailModal({ session, onClose }: { session: WorkoutSession; onClose: () => void }) {
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: sessionData, isLoading } = useQuery({
    queryKey: ['session-detail', session._id],
    queryFn: () => api.get(`/workout/sessions/${session._id}`).then((r) => r.data as WorkoutSession),
  });

  const deleteSession = useMutation({
    mutationFn: () => api.delete(`/workout/sessions/${session._id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workout-sessions'] });
      qc.invalidateQueries({ queryKey: ['recent-sessions'] });
      qc.invalidateQueries({ queryKey: ['workout-stats'] });
      onClose();
    },
  });

  const sets: WorkoutSet[] = sessionData?.sets ?? [];

  // Group by exercise preserving order
  const groups = useMemo(() => {
    const result: { id: string; name: string; sets: WorkoutSet[] }[] = [];
    const seen = new Map<string, number>();
    for (const s of sets) {
      if (!seen.has(s.exerciseId)) {
        seen.set(s.exerciseId, result.length);
        result.push({ id: s.exerciseId, name: s.exerciseName ?? 'Exercise', sets: [] });
      }
      result[seen.get(s.exerciseId)!].sets.push(s);
    }
    return result;
  }, [sets]);

  const duration = sessionData?.completedAt && sessionData?.startedAt
    ? Math.round((new Date(sessionData.completedAt).getTime() - new Date(sessionData.startedAt).getTime()) / 60000)
    : null;

  const totalVolume = sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.weight ?? 0), 0);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="font-bold text-slate-900">{sessionData?.name ?? session.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(session.startedAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              {duration != null && ` · ${duration} min`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 flex-shrink-0">
          {[
            { label: 'Exercises', value: groups.length },
            { label: 'Sets', value: sets.length },
            { label: 'Volume', value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : '—' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center py-3">
              <p className="text-lg font-bold text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Exercise breakdown */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="bg-slate-50 rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={15} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{group.name}</p>
                    <p className="text-xs text-slate-400">{group.sets.length} sets</p>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {group.sets.map((s) => {
                    const vol = s.reps && s.weight ? s.reps * s.weight : null;
                    return (
                      <div key={s.setNumber} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{s.setNumber}</span>
                        <span className="text-slate-700 font-medium">
                          {s.reps != null ? `${s.reps} reps` : '—'}
                          {s.weight != null && ` @ ${s.weight} kg`}
                        </span>
                        {vol != null && <span className="ml-auto text-xs text-slate-400">{vol} kg vol</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-slate-400 text-sm">No sets logged in this session</div>
          )}
        </div>

        <div className="px-5 py-4 pb-safe border-t border-slate-100 flex-shrink-0 space-y-2">
          {confirmDelete ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
              <p className="text-sm font-medium text-rose-800 text-center mb-2">Delete this session?</p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  loading={deleteSession.isPending}
                  onClick={() => deleteSession.mutate()}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
              <Button
                variant="ghost"
                className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-slate-100 shadow-xl flex flex-col max-h-[92dvh]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 pb-safe">{children}</div>
      </div>
    </div>
  );
}

function EmptyPlans({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
        <Dumbbell size={28} className="text-violet-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">No workout plans yet</p>
        <p className="text-sm text-slate-500 mt-1">Create your first plan to get started</p>
      </div>
      <Button onClick={onCreateClick}><Plus size={15} /> Create your first plan</Button>
    </div>
  );
}

function EmptySessions({ onStartClick }: { onStartClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Play size={28} className="text-blue-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">No sessions logged</p>
        <p className="text-sm text-slate-500 mt-1">Start a workout to track your progress</p>
      </div>
      <Button onClick={onStartClick}><Play size={15} /> Start a session</Button>
    </div>
  );
}
