import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { z } from 'zod';
import { FoodLog, FoodItem, MealType } from '../../schemas/food-log.schema';

const AddFoodItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().default('g'),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']).default('SNACK'),
  calories: z.number().min(0),
  protein: z.number().min(0).default(0),
  carbs: z.number().min(0).default(0),
  fat: z.number().min(0).default(0),
  fiber: z.number().min(0).default(0),
  imageUrl: z.string().optional(),
  barcode: z.string().optional(),
  servingSize: z.number().positive().default(100),
});

const UpdateGoalSchema = z.object({
  calorieGoal: z.number().int().min(500).max(10000),
});

interface OpenFoodProduct {
  product_name?: string;
  brands?: string;
  image_url?: string;
  serving_size?: string;
  serving_quantity?: number;
  code?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal'?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
    'energy-kcal_serving'?: number;
    proteins_serving?: number;
    carbohydrates_serving?: number;
    fat_serving?: number;
    fiber_serving?: number;
  };
}

function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

function totals(items: FoodItem[]) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + (item.calories ?? 0),
      protein: acc.protein + (item.protein ?? 0),
      carbs: acc.carbs + (item.carbs ?? 0),
      fat: acc.fat + (item.fat ?? 0),
      fiber: acc.fiber + (item.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}

@Injectable()
export class NutritionService {
  constructor(@InjectModel(FoodLog.name) private foodLogModel: Model<FoodLog>) {}

  async searchFood(query: string) {
    if (!query?.trim()) return { products: [] };

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15&fields=product_name,brands,image_url,nutriments,serving_size,serving_quantity,code`;

    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'WorkoutPro/1.0 (fitness app)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return { products: [] };

      const data = (await resp.json()) as { products?: OpenFoodProduct[] };
      const products = (data.products ?? [])
        .filter((p) => p.product_name && p.nutriments?.['energy-kcal_100g'] != null)
        .slice(0, 12)
        .map((p) => {
          const n = p.nutriments!;
          const cal100 = n['energy-kcal_100g'] ?? 0;
          const pro100 = n.proteins_100g ?? 0;
          const carb100 = n.carbohydrates_100g ?? 0;
          const fat100 = n.fat_100g ?? 0;
          const fiber100 = n.fiber_100g ?? 0;
          const serving = p.serving_quantity ?? 100;

          return {
            name: p.product_name!,
            brand: p.brands ?? undefined,
            imageUrl: p.image_url ?? undefined,
            barcode: p.code ?? undefined,
            servingSize: serving,
            unit: 'g',
            per100g: { calories: cal100, protein: pro100, carbs: carb100, fat: fat100, fiber: fiber100 },
            perServing: {
              calories: Math.round((cal100 * serving) / 100),
              protein: Math.round((pro100 * serving) / 100 * 10) / 10,
              carbs: Math.round((carb100 * serving) / 100 * 10) / 10,
              fat: Math.round((fat100 * serving) / 100 * 10) / 10,
              fiber: Math.round((fiber100 * serving) / 100 * 10) / 10,
            },
          };
        });

      return { products };
    } catch {
      return { products: [] };
    }
  }

  async getLog(userId: string, date?: string): Promise<unknown> {
    const d = date ?? todayString();
    const log = await this.foodLogModel.findOne({ userId, date: d }).lean();
    if (!log) return { date: d, items: [], calorieGoal: 2000, totals: totals([]) };
    return { ...log, totals: totals(log.items as FoodItem[]) };
  }

  async addItem(userId: string, date: string | undefined, body: unknown) {
    const d = date ?? todayString();
    const input = AddFoodItemSchema.parse(body);

    const log = await this.foodLogModel.findOneAndUpdate(
      { userId, date: d },
      { $setOnInsert: { userId, date: d, calorieGoal: 2000 } },
      { upsert: true, new: true },
    );

    log.items.push(input as unknown as FoodItem);
    await log.save();
    return { ...log.toObject(), totals: totals(log.items) };
  }

  async removeItem(userId: string, date: string, itemId: string) {
    const log = await this.foodLogModel.findOne({ userId, date });
    if (!log) throw new NotFoundException('Log not found');

    const idx = log.items.findIndex((i: FoodItem & { _id?: { toString(): string } }) => i._id?.toString() === itemId);
    if (idx === -1) throw new NotFoundException('Item not found');
    log.items.splice(idx, 1);
    await log.save();
    return { ...log.toObject(), totals: totals(log.items) };
  }

  async updateGoal(userId: string, date: string | undefined, body: unknown): Promise<unknown> {
    const d = date ?? todayString();
    const { calorieGoal } = UpdateGoalSchema.parse(body);
    const log = await this.foodLogModel.findOneAndUpdate(
      { userId, date: d },
      { $set: { calorieGoal }, $setOnInsert: { userId, date: d } },
      { upsert: true, new: true },
    ).lean();
    return { ...log, totals: totals((log as { items: FoodItem[] }).items ?? []) };
  }

  async getSummary(userId: string, days = 7) {
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }

    const logs = await this.foodLogModel.find({ userId, date: { $in: dates } }).lean();
    const logMap = new Map(logs.map((l) => [l.date as string, l]));

    return dates.map((date) => {
      const log = logMap.get(date);
      const items = (log as { items?: FoodItem[] } | undefined)?.items ?? [];
      const t = totals(items as FoodItem[]);
      return { date, ...t, calorieGoal: (log as { calorieGoal?: number } | undefined)?.calorieGoal ?? 2000 };
    });
  }
}
