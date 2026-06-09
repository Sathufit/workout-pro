'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const [loggingSession, setLoggingSession] = useState<WorkoutSession | null>(null);
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
                onOpen={!s.completedAt ? () => setLoggingSession(s) : undefined}
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
    </div>
  );
}

function PlanCard({ plan, onStart, onManage, onDelete, starting }: {
  plan: WorkoutPlan; onStart: () => void; onManage: () => void; onDelete: () => void; starting: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Dumbbell size={18} className="text-violet-600" />
          </div>
          <div className="relative">
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

        <div className="flex gap-2">
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
      className={!done && onOpen ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}
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
        {!done && <ChevronRight size={16} className="text-violet-400 flex-shrink-0" />}
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
  const [activeExercise, setActiveExercise] = useState<{ id: string; name: string } | null>(null);
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');

  const { data: sessionData, refetch } = useQuery({
    queryKey: ['session-live', session._id],
    queryFn: () => api.get(`/workout/sessions/${session._id}`).then((r) => r.data as WorkoutSession),
    refetchInterval: 5000,
  });

  const { data: searchData } = useQuery({
    queryKey: ['ex-search-live', debouncedSearch],
    queryFn: () => api.get(`/exercises?search=${encodeURIComponent(debouncedSearch)}&limit=8`).then((r) => r.data),
    enabled: debouncedSearch.trim().length > 1,
    placeholderData: (p) => p,
  });

  const logSet = useMutation({
    mutationFn: (body: object) => api.post(`/workout/sessions/${session._id}/sets`, body),
    onSuccess: () => {
      refetch();
      qc.invalidateQueries({ queryKey: ['workout-stats'] });
    },
  });

  const completeSession = useMutation({
    mutationFn: () => api.patch(`/workout/sessions/${session._id}`, {}),
    onSuccess: () => onClose(),
  });

  const sets: WorkoutSet[] = sessionData?.sets ?? [];
  const isCompleted = !!sessionData?.completedAt;

  // Group sets by exercise preserving insertion order
  const exerciseGroups: { id: string; name: string; sets: WorkoutSet[] }[] = [];
  const seen = new Map<string, number>();
  for (const s of sets) {
    if (!seen.has(s.exerciseId)) {
      seen.set(s.exerciseId, exerciseGroups.length);
      exerciseGroups.push({ id: s.exerciseId, name: s.exerciseName ?? 'Exercise', sets: [] });
    }
    exerciseGroups[seen.get(s.exerciseId)!].sets.push(s);
  }

  const getSetsForExercise = (id: string) => sets.filter((s) => s.exerciseId === id);
  const getNextSetNum = (id: string) => getSetsForExercise(id).length + 1;
  const getLastWeight = (id: string) => {
    const prev = getSetsForExercise(id).filter((s) => s.weight != null);
    return prev.length ? String(prev[prev.length - 1].weight) : '';
  };

  const handleSelectExercise = (ex: Exercise) => {
    setActiveExercise({ id: ex._id, name: ex.name });
    setSearchQuery('');
    setDebouncedSearch('');
    setShowResults(false);
    setWeight(getLastWeight(ex._id));
    setReps('10');
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
              {exerciseGroups.length} exercise{exerciseGroups.length !== 1 ? 's' : ''} · {sets.length} sets
            </p>
          </div>
        </div>
        {!isCompleted && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => completeSession.mutate()}
            loading={completeSession.isPending}
          >
            <CheckCircle2 size={14} />
            Finish
          </Button>
        )}
        {isCompleted && <Badge variant="success">Completed</Badge>}
      </div>

      {/* Sticky search */}
      {!isCompleted && (
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
              placeholder="Search exercise to add (e.g. bench press)…"
              value={searchQuery}
              onChange={(e) => {
                const v = e.target.value;
                setSearchQuery(v);
                setShowResults(true);
                setTimeout(() => setDebouncedSearch(v), 350);
              }}
              onFocus={() => setShowResults(true)}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setDebouncedSearch(''); setShowResults(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Live search results */}
          {showResults && debouncedSearch.trim().length > 1 && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
              {(searchData?.items ?? []).slice(0, 6).map((ex: Exercise) => (
                <button
                  key={ex._id}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 active:bg-violet-100 transition-colors text-left border-b border-slate-50 last:border-0"
                  onClick={() => handleSelectExercise(ex)}
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Dumbbell size={14} className="text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{ex.name}</p>
                    {ex.primaryMuscles?.length > 0 && (
                      <p className="text-xs text-slate-400 capitalize">{ex.primaryMuscles.slice(0, 2).join(' · ')}</p>
                    )}
                  </div>
                  <Plus size={15} className="text-violet-400 flex-shrink-0" />
                </button>
              ))}
              {(searchData?.items ?? []).length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">No exercises found for "{debouncedSearch}"</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Active set-logger card */}
        {activeExercise && !isCompleted && (
          <div className="mx-4 mt-4 bg-white rounded-2xl border border-violet-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider">Now logging</p>
                <p className="font-semibold text-slate-900 truncate">{activeExercise.name}</p>
              </div>
              <button onClick={() => setActiveExercise(null)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* Previous sets for this exercise */}
            {getSetsForExercise(activeExercise.id).length > 0 && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Previous sets</p>
                <div className="space-y-1">
                  {getSetsForExercise(activeExercise.id).map((s) => (
                    <div key={s.setNumber} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {s.setNumber}
                      </span>
                      <span className="text-slate-600">{s.reps ?? '—'} reps</span>
                      {s.weight != null && (
                        <span className="text-slate-700 font-medium">@ {s.weight} kg</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New set form */}
            <div className="px-4 py-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Set {getNextSetNum(activeExercise.id)}
              </p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Input
                  label="Reps"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="10"
                />
                <Input
                  label="Weight (kg)"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 52.25"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleLogSet}
                loading={logSet.isPending}
                disabled={!reps && !weight}
              >
                Log set {getNextSetNum(activeExercise.id)}
              </Button>
            </div>
          </div>
        )}

        {/* Logged exercises summary */}
        <div className="p-4 space-y-3">
          {exerciseGroups.length > 0 ? (
            exerciseGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  onClick={() => {
                    if (isCompleted) return;
                    setActiveExercise({ id: group.id, name: group.name });
                    setSearchQuery('');
                    setShowResults(false);
                    setWeight(getLastWeight(group.id));
                    setReps('10');
                  }}
                  disabled={isCompleted}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Dumbbell size={15} className="text-violet-600" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{group.name}</p>
                      <p className="text-xs text-slate-400">{group.sets.length} set{group.sets.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {!isCompleted && <ChevronRight size={15} className="text-slate-300 flex-shrink-0" />}
                </button>
                <div className="px-4 pb-3 border-t border-slate-50 space-y-1 pt-2">
                  {group.sets.map((s) => (
                    <div key={s.setNumber} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[9px]">
                        {s.setNumber}
                      </span>
                      <span>{s.reps != null ? `${s.reps} reps` : '—'}</span>
                      {s.weight != null && (
                        <span className="text-slate-700 font-semibold">@ {s.weight} kg</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            !isCompleted && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Dumbbell size={28} className="text-violet-300" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700">No exercises yet</p>
                  <p className="text-sm text-slate-400 mt-1">Search above to find an exercise and start logging</p>
                </div>
              </div>
            )
          )}

          {isCompleted && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <CheckCircle2 size={36} className="text-emerald-500" />
              <div>
                <p className="font-semibold text-slate-800">Workout Complete!</p>
                <p className="text-sm text-slate-500 mt-1">
                  {sets.length} sets · {exerciseGroups.length} exercises
                </p>
              </div>
              <Button variant="secondary" onClick={onClose}>Back to sessions</Button>
            </div>
          )}
        </div>

        {/* Bottom padding for home indicator */}
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
