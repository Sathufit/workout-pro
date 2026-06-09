'use client';

import { useState, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  X,
  Target,
  Flame,
  Beef,
  Wheat,
  Droplets,
  Loader2,
} from 'lucide-react';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

const MEALS: { id: MealType; label: string; emoji: string }[] = [
  { id: 'BREAKFAST', label: 'Breakfast', emoji: '🌅' },
  { id: 'LUNCH', label: 'Lunch', emoji: '☀️' },
  { id: 'DINNER', label: 'Dinner', emoji: '🌙' },
  { id: 'SNACK', label: 'Snacks', emoji: '🍎' },
];

const MACRO_COLORS = { protein: '#7c3aed', carbs: '#3b82f6', fat: '#f59e0b', fiber: '#10b981' };

interface FoodItem {
  _id: string;
  name: string;
  brand?: string;
  quantity: number;
  unit: string;
  mealType: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  imageUrl?: string;
}

interface FoodLog {
  date: string;
  items: FoodItem[];
  calorieGoal: number;
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
}

interface SearchResult {
  name: string;
  brand?: string;
  imageUrl?: string;
  barcode?: string;
  servingSize: number;
  unit: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  perServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
}

function dateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmtDate(d: Date) {
  const today = dateStr(new Date());
  const yesterday = dateStr(addDays(new Date(), -1));
  const s = dateStr(d);
  if (s === today) return 'Today';
  if (s === yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function NutritionPage() {
  const [date, setDate] = useState(new Date());
  const [addMeal, setAddMeal] = useState<MealType | null>(null);
  const qc = useQueryClient();
  const ds = dateStr(date);
  const isToday = ds === dateStr(new Date());

  const { data: log, isLoading } = useQuery<FoodLog>({
    queryKey: ['food-log', ds],
    queryFn: () => api.get(`/nutrition/logs?date=${ds}`).then((r) => r.data),
  });

  const { data: summary } = useQuery<{ date: string; calories: number; calorieGoal: number }[]>({
    queryKey: ['nutrition-summary'],
    queryFn: () => api.get('/nutrition/summary?days=7').then((r) => r.data),
  });

  const removeItem = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      api.delete(`/nutrition/logs/${ds}/items/${itemId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['food-log', ds] }),
  });

  const totals = log?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const goal = log?.calorieGoal ?? 2000;
  const calPct = Math.min(100, Math.round((totals.calories / goal) * 100));
  const remaining = Math.max(0, goal - totals.calories);

  const pieData = [
    { name: 'Protein', value: Math.round(totals.protein * 4), color: MACRO_COLORS.protein },
    { name: 'Carbs', value: Math.round(totals.carbs * 4), color: MACRO_COLORS.carbs },
    { name: 'Fat', value: Math.round(totals.fat * 9), color: MACRO_COLORS.fat },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nutrition</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your daily food and calorie intake</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2 py-1.5">
          <button
            onClick={() => setDate((d) => addDays(d, -1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-slate-700 min-w-24 text-center">
            {fmtDate(date)}
          </span>
          <button
            onClick={() => setDate((d) => addDays(d, 1))}
            disabled={isToday}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calorie overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MacroCard
          label="Calories"
          value={totals.calories}
          unit="kcal"
          icon={<Flame size={17} className="text-orange-500" />}
          accent="bg-orange-50"
        />
        <MacroCard
          label="Protein"
          value={`${totals.protein.toFixed(1)}`}
          unit="g"
          icon={<Beef size={17} className="text-violet-600" />}
          accent="bg-violet-50"
        />
        <MacroCard
          label="Carbs"
          value={`${totals.carbs.toFixed(1)}`}
          unit="g"
          icon={<Wheat size={17} className="text-blue-600" />}
          accent="bg-blue-50"
        />
        <MacroCard
          label="Fat"
          value={`${totals.fat.toFixed(1)}`}
          unit="g"
          icon={<Droplets size={17} className="text-amber-500" />}
          accent="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calorie progress */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Daily Goal</CardTitle>
              <div className="flex items-center gap-1.5">
                <Target size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">{goal} kcal goal</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">
                  <span className="font-semibold text-slate-900">{totals.calories}</span> kcal eaten
                </span>
                <span className={remaining > 0 ? 'text-slate-500' : 'text-rose-500 font-medium'}>
                  {remaining > 0 ? `${remaining} kcal remaining` : `${Math.abs(goal - totals.calories)} kcal over`}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${calPct >= 100 ? 'bg-rose-500' : 'bg-violet-600'}`}
                  style={{ width: `${Math.min(calPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">{calPct}%</p>
            </div>

            {/* Macro bars */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Protein', value: totals.protein, goal: Math.round(goal * 0.3 / 4), unit: 'g', color: 'bg-violet-500' },
                { label: 'Carbs', value: totals.carbs, goal: Math.round(goal * 0.5 / 4), unit: 'g', color: 'bg-blue-500' },
                { label: 'Fat', value: totals.fat, goal: Math.round(goal * 0.2 / 9), unit: 'g', color: 'bg-amber-500' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{m.label}</span>
                    <span>{m.value.toFixed(0)}/{m.goal}{m.unit}</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${m.color}`}
                      style={{ width: `${Math.min(100, (m.value / m.goal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Macro pie */}
        <Card>
          <CardHeader>
            <CardTitle>Macro Split</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v} kcal`]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-medium text-slate-700">{d.value} kcal</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
                <Wheat size={28} className="text-slate-200" />
                <p className="text-xs text-slate-400">Log food to see macro split</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly chart */}
      {summary && summary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Calories</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={summary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v} kcal`, 'Calories']}
                  labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                />
                <Bar dataKey="calories" fill="#7c3aed" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="calorieGoal" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-violet-600" />Calories eaten</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-200" />Daily goal</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal sections */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-12 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {MEALS.map((meal) => {
            const mealItems = (log?.items ?? []).filter((item) => item.mealType === meal.id);
            const mealCals = mealItems.reduce((s, i) => s + i.calories, 0);
            return (
              <Card key={meal.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{meal.emoji}</span>
                      <h3 className="font-semibold text-slate-900">{meal.label}</h3>
                      {mealCals > 0 && (
                        <Badge variant="default" className="text-xs">{mealCals} kcal</Badge>
                      )}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setAddMeal(meal.id)}>
                      <Plus size={13} />
                      Add food
                    </Button>
                  </div>

                  {mealItems.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {mealItems.map((item) => (
                        <div key={item._id} className="flex items-center justify-between py-2.5 first:pt-0">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.imageUrl} alt={item.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100 flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">🍽️</div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.name}</p>
                              <p className="text-xs text-slate-400">{item.quantity}{item.unit}{item.brand ? ` · ${item.brand}` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-semibold text-slate-900">{item.calories} kcal</p>
                              <p className="text-xs text-slate-400">P:{item.protein.toFixed(0)}g C:{item.carbs.toFixed(0)}g F:{item.fat.toFixed(0)}g</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-900 sm:hidden">{item.calories} kcal</p>
                            <button
                              onClick={() => removeItem.mutate({ itemId: item._id })}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">
                      Nothing logged for {meal.label.toLowerCase()} yet
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add food modal */}
      {addMeal && (
        <AddFoodModal
          mealType={addMeal}
          date={ds}
          onClose={() => setAddMeal(null)}
          onAdded={() => {
            qc.invalidateQueries({ queryKey: ['food-log', ds] });
            qc.invalidateQueries({ queryKey: ['nutrition-summary'] });
          }}
        />
      )}
    </div>
  );
}

function MacroCard({ label, value, unit, icon, accent }: {
  label: string; value: string | number; unit: string; icon: ReactNode; accent: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`w-7 h-7 rounded-lg ${accent} flex items-center justify-center`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">
        {value}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </p>
    </Card>
  );
}

function AddFoodModal({
  mealType, date, onClose, onAdded,
}: {
  mealType: MealType;
  date: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [useServing, setUseServing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: results, isLoading: searching } = useQuery<{ products: SearchResult[] }>({
    queryKey: ['food-search', debouncedQ],
    queryFn: () => api.get(`/nutrition/search?q=${encodeURIComponent(debouncedQ)}`).then((r) => r.data),
    enabled: debouncedQ.length > 2,
  });

  const handleQueryChange = (v: string) => {
    setQuery(v);
    const t = setTimeout(() => setDebouncedQ(v), 400);
    return () => clearTimeout(t);
  };

  const nutriPer = (food: SearchResult, qty: number) => {
    const base = useServing ? food.perServing : food.per100g;
    const ratio = qty / (useServing ? food.servingSize : 100);
    return {
      calories: Math.round(base.calories * ratio * (useServing ? 1 : 1) || (food.per100g.calories * qty / 100)),
      protein: Math.round((food.per100g.protein * qty / 100) * 10) / 10,
      carbs: Math.round((food.per100g.carbs * qty / 100) * 10) / 10,
      fat: Math.round((food.per100g.fat * qty / 100) * 10) / 10,
      fiber: Math.round((food.per100g.fiber * qty / 100) * 10) / 10,
    };
  };

  const handleAdd = async () => {
    if (!selected || !quantity) { setError('Please select a food and enter quantity'); return; }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) { setError('Please enter a valid quantity'); return; }

    setLoading(true);
    try {
      const nutri = nutriPer(selected, qty);
      await api.post(`/nutrition/logs/items?date=${date}`, {
        name: selected.name,
        brand: selected.brand,
        quantity: qty,
        unit: 'g',
        mealType,
        ...nutri,
        imageUrl: selected.imageUrl,
        barcode: selected.barcode,
        servingSize: selected.servingSize,
      });
      onAdded();
      onClose();
    } catch {
      setError('Failed to add food. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const qty = parseFloat(quantity) || 0;
  const preview = selected && qty > 0 ? nutriPer(selected, qty) : null;

  const mealLabel = MEALS.find((m) => m.id === mealType)?.label ?? mealType;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Add to {mealLabel}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Search from 2M+ foods · OpenFoodFacts</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-slate-50"
              placeholder="Search foods (e.g. banana, chicken breast, oats...)"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500 animate-spin" />}
          </div>
        </div>

        {/* Results or selected */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <>
              {debouncedQ.length > 2 && !searching && (results?.products?.length ?? 0) === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">No results for "{debouncedQ}"</div>
              )}
              {!debouncedQ && (
                <div className="text-center py-12 text-slate-400 text-sm">Type at least 3 characters to search</div>
              )}
              <div className="divide-y divide-slate-50">
                {(results?.products ?? []).map((product, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => {
                      setSelected(product);
                      setQuantity(String(product.servingSize));
                    }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl flex-shrink-0">🍽️</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm line-clamp-1">{product.name}</p>
                      {product.brand && <p className="text-xs text-slate-400 mt-0.5">{product.brand}</p>}
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{product.perServing.calories} kcal</span>
                        <span>P: {product.perServing.protein}g</span>
                        <span>C: {product.perServing.carbs}g</span>
                        <span>F: {product.perServing.fat}g</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">per {product.servingSize}g</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="p-5 space-y-4">
              {/* Selected food */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                {selected.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.imageUrl} alt={selected.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 line-clamp-1">{selected.name}</p>
                  {selected.brand && <p className="text-xs text-slate-400">{selected.brand}</p>}
                  <p className="text-xs text-slate-500 mt-0.5">{selected.per100g.calories} kcal / 100g</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={16} />
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantity (grams)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="e.g. 150"
                  />
                  <span className="flex items-center text-sm text-slate-500 px-2">g</span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[50, 100, 150, 200].map((v) => (
                    <button
                      key={v}
                      onClick={() => setQuantity(String(v))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        quantity === String(v) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v}g
                    </button>
                  ))}
                  {selected.servingSize !== 100 && (
                    <button
                      onClick={() => setQuantity(String(selected.servingSize))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        quantity === String(selected.servingSize) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {selected.servingSize}g (serving)
                    </button>
                  )}
                </div>
              </div>

              {/* Nutrition preview */}
              {preview && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Calories', value: `${preview.calories}`, unit: 'kcal', color: 'text-orange-600' },
                    { label: 'Protein', value: `${preview.protein}`, unit: 'g', color: 'text-violet-600' },
                    { label: 'Carbs', value: `${preview.carbs}`, unit: 'g', color: 'text-blue-600' },
                    { label: 'Fat', value: `${preview.fat}`, unit: 'g', color: 'text-amber-600' },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-slate-400">{m.unit}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        {selected && (
          <div className="p-4 border-t border-slate-100 flex gap-2 flex-shrink-0">
            <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Back</Button>
            <Button className="flex-1" loading={loading} onClick={handleAdd}>
              Add to {mealLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
