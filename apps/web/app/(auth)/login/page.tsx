'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginSchema, type LoginInput } from '@workout-pro/shared';
import { useAuthStore } from '../../../store/auth.store';
import { Button } from '../../../components/ui/button';
import { Zap, Dumbbell, HeartPulse, TrendingUp } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
      router.push('/dashboard');
    } catch {
      setError('root', { message: 'Invalid email or password' });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl">Workout Pro</span>
        </div>

        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Train smarter,<br />
              <span className="text-violet-400">not harder.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              Track workouts, monitor health metrics, and reach your fitness goals with data-driven insights.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <Dumbbell size={18} className="text-violet-400" />, title: 'Custom workout plans', desc: 'Build plans tailored to your goals and schedule' },
              { icon: <HeartPulse size={18} className="text-violet-400" />, title: 'Health tracking', desc: 'Monitor weight, BMI, and body composition over time' },
              { icon: <TrendingUp size={18} className="text-violet-400" />, title: 'Progress insights', desc: 'Visualize your improvements with detailed charts' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">© 2026 Workout Pro. All rights reserved.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-6 bg-slate-50 pt-safe">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Workout Pro</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <p className="text-sm text-rose-600">{errors.root.message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition placeholder:text-slate-400"
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link href="/forgot-password" className="text-xs text-violet-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                {...register('password')}
                type="password"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition placeholder:text-slate-400"
                placeholder="••••••••"
              />
              {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-violet-600 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
