import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';
import { signInAdmin } from '../lib/supabase';

interface AdminLoginPageProps {
  onLoginSuccess: () => void;
  onBackToHome: () => void;
  isSupabaseConfigured: boolean;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onLoginSuccess,
  onBackToHome,
  isSupabaseConfigured,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your administrator email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await signInAdmin(email, password);
      onLoginSuccess();
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Invalid login credentials.';
      if (msg.includes('Invalid login credentials')) {
        setErrorMessage('Incorrect email or password. Please verify your administrator credentials.');
      } else if (msg.includes('app_admins')) {
        setErrorMessage(msg);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#81758F] hover:text-[#493D61] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to PrintMate Guides</span>
        </button>

        {/* Card */}
        <div className="bg-white border border-[#E9DFF5] rounded-3xl p-7 sm:p-8 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-[#EDE5FF] border border-[#E9DFF5] flex items-center justify-center text-[#493D61]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#493D61] tracking-tight">Administrator Login</h1>
              <p className="text-xs text-[#81758F]">Access notebook editing and guides management</p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-5 p-3.5 bg-[#EDE5FF] border border-[#DCCEFF] rounded-2xl text-xs text-[#493D61] flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#81758F] shrink-0 mt-0.5" />
              <div>
                <strong>Notice:</strong> Connect your Supabase project using the top banner to enable live authentication and authorization.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#493D61] mb-1.5">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@shop.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF] transition-all"
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[#493D61] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 text-sm bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl text-[#493D61] placeholder-[#81758F]/60 focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] focus:border-[#DCCEFF] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#81758F] hover:text-[#493D61]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 min-h-[46px]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#493D61] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Preview Admin Access */}
          <div className="mt-5 pt-4 border-t border-[#E9DFF5]">
            <div className="bg-[#EDE5FF]/70 border border-[#DCCEFF] rounded-2xl p-3.5 text-center">
              <p className="text-xs font-semibold text-[#493D61] mb-1">
                Testing in AI Studio Preview?
              </p>
              <p className="text-[11px] text-[#81758F] mb-3 leading-relaxed">
                You can enter the Admin Notebook immediately to create guides, reorder steps, and manage categories right now.
              </p>
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess();
                }}
                className="w-full py-2.5 px-3 bg-white hover:bg-[#FFFDF8] border border-[#DCCEFF] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Enter Admin Notebook (Preview Access)</span>
              </button>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#E9DFF5] text-[11px] text-[#81758F] space-y-2">
            <p className="font-semibold text-[#493D61]">How to Create Your Permanent Admin Login in Supabase:</p>
            <ol className="list-decimal list-inside space-y-1 pl-0.5 leading-relaxed">
              <li>
                In your Supabase project, go to <strong>Authentication → Users → Add User</strong>.
              </li>
              <li>
                Enter your preferred email (e.g. <code className="bg-[#FFF8EF] px-1 py-0.5 rounded border border-[#E9DFF5]">admin@shop.com</code> or your personal email) and choose any password.
              </li>
              <li>
                Run this in the Supabase SQL Editor to grant admin privileges:
                <pre className="mt-1 p-2 bg-[#FFFDF8] border border-[#E9DFF5] rounded-lg font-mono text-[10px] text-[#493D61] overflow-x-auto">
{`INSERT INTO public.app_admins (user_id)
SELECT id FROM auth.users WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO NOTHING;`}
                </pre>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
