'use client';

import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import { Search, ChevronLeft, ChevronRight, Filter, Dumbbell, X, ChevronDown, ChevronUp, Play } from 'lucide-react';

type Category = 'STRENGTH' | 'CARDIO' | 'FLEXIBILITY' | 'BALANCE' | 'PLYOMETRIC' | 'POWERLIFTING' | 'OLYMPIC_LIFTING' | 'CALISTHENICS' | 'YOGA' | 'STRETCHING';
type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

const CATEGORY_BADGE: Record<Category, { label: string; variant: 'purple' | 'info' | 'success' | 'warning' | 'orange' | 'default' }> = {
  STRENGTH: { label: 'Strength', variant: 'purple' },
  CARDIO: { label: 'Cardio', variant: 'info' },
  FLEXIBILITY: { label: 'Flexibility', variant: 'success' },
  BALANCE: { label: 'Balance', variant: 'warning' },
  PLYOMETRIC: { label: 'Plyometric', variant: 'orange' },
  POWERLIFTING: { label: 'Powerlifting', variant: 'purple' },
  OLYMPIC_LIFTING: { label: 'Olympic', variant: 'purple' },
  CALISTHENICS: { label: 'Calisthenics', variant: 'info' },
  YOGA: { label: 'Yoga', variant: 'success' },
  STRETCHING: { label: 'Stretching', variant: 'success' },
};

const DIFFICULTY_BADGE: Record<Difficulty, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  BEGINNER: { label: 'Beginner', variant: 'success' },
  INTERMEDIATE: { label: 'Intermediate', variant: 'warning' },
  ADVANCED: { label: 'Advanced', variant: 'danger' },
};

const CATEGORIES: Category[] = [
  'STRENGTH', 'CARDIO', 'FLEXIBILITY', 'BALANCE', 'PLYOMETRIC',
  'POWERLIFTING', 'OLYMPIC_LIFTING', 'CALISTHENICS', 'YOGA', 'STRETCHING',
];

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'abdominals',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'forearms', 'traps',
];

interface Exercise {
  _id: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  description?: string;
  instructions?: string[];
  images?: string[];
  imageUrl?: string;
  force?: string;
  mechanic?: string;
  isCustom?: boolean;
}

const PAGE_SIZE = 12;

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [muscle, setMuscle] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String((page - 1) * PAGE_SIZE),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(category && { category }),
    ...(muscle && { primaryMuscle: muscle }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['exercises', debouncedSearch, category, muscle, page],
    queryFn: () => api.get(`/exercises?${params}`).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const exercises: Exercise[] = data?.items ?? [];
  const total: number = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    setTimeout(() => setDebouncedSearch(v), 400);
  };

  const handleCategory = (v: string) => { setCategory(v); setPage(1); };
  const handleMuscle = (v: string) => { setMuscle(v); setPage(1); };

  return (
    <div className="px-4 py-5 lg:px-8 lg:py-8 max-w-7xl mx-auto space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Exercise Library</h1>
          <p className="text-slate-500 text-xs lg:text-sm mt-0.5 hidden sm:block">
            {total > 0 ? `${total} exercises with instructions` : 'Browse the database'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowFilters((f) => !f)} className="flex-shrink-0">
          <Filter size={14} />
          Filters
          {(category || muscle) && (
            <span className="w-4 h-4 bg-violet-600 text-white rounded-full text-xs flex items-center justify-center">
              {[category, muscle].filter(Boolean).length}
            </span>
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Filters — horizontal scroll on mobile */}
      {showFilters && (
        <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Category</p>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
              <FilterChip active={category === ''} onClick={() => handleCategory('')}>All</FilterChip>
              {CATEGORIES.map((c) => (
                <FilterChip key={c} active={category === c} onClick={() => handleCategory(c === category ? '' : c)}>
                  {CATEGORY_BADGE[c].label}
                </FilterChip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Muscle Group</p>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
              <FilterChip active={muscle === ''} onClick={() => handleMuscle('')}>All</FilterChip>
              {MUSCLE_GROUPS.map((m) => (
                <FilterChip key={m} active={muscle === m} onClick={() => handleMuscle(m === muscle ? '' : m)}>
                  <span className="capitalize">{m}</span>
                </FilterChip>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid — 2 cols on mobile */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 lg:h-40 w-full rounded-none" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : exercises.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
          {exercises.map((ex) => (
            <ExerciseCard key={ex._id} exercise={ex} onClick={() => setSelected(ex)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
            <Dumbbell size={24} className="text-slate-300" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">No exercises found</p>
            <p className="text-sm text-slate-500 mt-1">
              {total === 0 ? 'Database loading — check back shortly' : 'Try different filters'}
            </p>
          </div>
          {(category || muscle || debouncedSearch) && (
            <Button variant="secondary" size="sm" onClick={() => { setSearch(''); setDebouncedSearch(''); setCategory(''); setMuscle(''); }}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page}/{totalPages} · {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Exercise detail drawer */}
      {selected && <ExerciseDrawer exercise={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-violet-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

function ExerciseCard({ exercise, onClick }: { exercise: Exercise; onClick: () => void }) {
  const catCfg = CATEGORY_BADGE[exercise.category];
  const diffCfg = DIFFICULTY_BADGE[exercise.difficulty];
  const img = exercise.images?.[0] ?? exercise.imageUrl;

  return (
    <Card className="cursor-pointer hover:shadow-md hover:border-violet-100 transition-all group overflow-hidden" onClick={onClick}>
      {/* Image */}
      <div className="relative h-32 lg:h-40 bg-slate-100 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={exercise.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Dumbbell size={32} className="text-slate-300" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={16} className="text-violet-600 ml-0.5" />
          </div>
        </div>
      </div>

      <CardContent className="p-3 lg:p-4">
        <h3 className="font-semibold text-slate-900 text-xs lg:text-sm mb-1 leading-snug line-clamp-2">{exercise.name}</h3>
        {exercise.primaryMuscles?.length > 0 && (
          <p className="text-[11px] lg:text-xs text-slate-500 mb-2 capitalize line-clamp-1">
            {exercise.primaryMuscles.slice(0, 2).join(' · ')}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {catCfg && <Badge variant={catCfg.variant} className="text-[10px]">{catCfg.label}</Badge>}
          {diffCfg && <Badge variant={diffCfg.variant} className="text-[10px]">{diffCfg.label}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function ExerciseDrawer({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const catCfg = CATEGORY_BADGE[exercise.category];
  const diffCfg = DIFFICULTY_BADGE[exercise.difficulty];
  const images = exercise.images ?? (exercise.imageUrl ? [exercise.imageUrl] : []);
  const instructions = exercise.instructions ?? [];
  const displayInstructions = showAll ? instructions : instructions.slice(0, 4);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto">
        {/* Image carousel */}
        {images.length > 0 && (
          <div className="relative h-56 bg-slate-100 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[imgIdx]}
              alt={`${exercise.name} step ${imgIdx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 bg-black/30 rounded-full flex items-center justify-center text-white hover:bg-black/50"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-lg leading-tight">{exercise.name}</h2>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {catCfg && <Badge variant={catCfg.variant}>{catCfg.label}</Badge>}
              {diffCfg && <Badge variant={diffCfg.variant}>{diffCfg.label}</Badge>}
              {exercise.mechanic && <Badge variant="default" className="capitalize">{exercise.mechanic}</Badge>}
              {exercise.force && <Badge variant="default" className="capitalize">{exercise.force}</Badge>}
            </div>
          </div>
          {images.length === 0 && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 flex-1">
          {/* Muscles */}
          {exercise.primaryMuscles?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Primary Muscles</h3>
              <div className="flex flex-wrap gap-1.5">
                {exercise.primaryMuscles.map((m) => (
                  <Badge key={m} variant="purple" className="capitalize">{m.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          )}
          {exercise.secondaryMuscles?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Secondary Muscles</h3>
              <div className="flex flex-wrap gap-1.5">
                {exercise.secondaryMuscles.map((m) => (
                  <Badge key={m} variant="default" className="capitalize">{m.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          )}
          {exercise.equipment?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Equipment</h3>
              <div className="flex flex-wrap gap-1.5">
                {exercise.equipment.map((e) => (
                  <Badge key={e} variant="info" className="capitalize">{e.replace(/_/g, ' ')}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-step instructions */}
          {instructions.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Step-by-Step Instructions</h3>
              <div className="space-y-3">
                {displayInstructions.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              {instructions.length > 4 && (
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="mt-3 flex items-center gap-1 text-xs text-violet-600 hover:underline font-medium"
                >
                  {showAll ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {instructions.length - 4} more steps</>}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-5 pb-safe border-t border-slate-100 flex-shrink-0">
          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
