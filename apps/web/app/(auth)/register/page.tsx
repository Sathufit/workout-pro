'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RegisterSchema, type RegisterInput } from '@workout-pro/shared';
import { useAuthStore } from '../../../store/auth.store';
import { Button } from '../../../components/ui/button';
import { Zap, Shield, BarChart2, Bell } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, setError } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      await registerUser(data);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError('root', { message: msg ?? 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg">Workout Pro</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="text-slate-500 mt-1">Start your fitness journey today</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <p className="text-sm text-rose-600">{errors.root.message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Full name</label>
              <input
                {...register('name')}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition placeholder:text-slate-400"
                placeholder="Alex Johnson"
              />
              {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
            </div>

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
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <input
                {...register('password')}
                type="password"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 hover:border-slate-300 transition placeholder:text-slate-400"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
              />
              {errors.password && <p className="text-xs text-rose-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isLoading}>
              Create account
            </Button>

            <p className="text-xs text-slate-400 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

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
              Everything you need<br />
              <span className="text-violet-400">to reach your goals.</span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              Join thousands of athletes who use Workout Pro to plan, track, and crush their fitness goals.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: <BarChart2 size={18} className="text-violet-400" />, title: 'Data-driven progress', desc: 'See your improvements with visual charts and stats' },
              { icon: <Bell size={18} className="text-violet-400" />, title: 'Smart reminders', desc: 'Never miss a workout with customizable notifications' },
              { icon: <Shield size={18} className="text-violet-400" />, title: 'Your data, private', desc: 'All your health data is encrypted and secure' },
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
    </div>
  );
}
