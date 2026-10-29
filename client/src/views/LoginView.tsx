import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import { AuthUser } from '../../../shared/types.js';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

interface DemoAccount {
  name: string;
  loginId: string;
  role: string;
  pass: string;
  badgeColor: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Ashwin Kumar',
    loginId: 'ashwin',
    role: 'Admin',
    pass: 'admin123',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  },
  {
    name: 'Karthik S.',
    loginId: 'karthik',
    role: 'Sales Manager',
    pass: 'admin123',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    name: 'Priya N.',
    loginId: 'priya',
    role: 'Sales Rep',
    pass: 'admin123',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    name: 'Suresh V.',
    loginId: 'suresh',
    role: 'Business Analyst',
    pass: 'admin123',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  }
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !password.trim()) {
      setErrorMessage('Please enter both your User ID and Password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.login({
        loginId: loginId.trim(),
        password: password.trim()
      });

      if (res?.user) {
        onLoginSuccess(res.user);
      } else {
        throw new Error('Authentication response was invalid.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err?.message || 'Invalid User ID or Password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDemo = (demo: DemoAccount) => {
    setLoginId(demo.loginId);
    setPassword(demo.pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Mesh Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-950/30 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #10b981 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-emerald-950/50 rounded-3xl p-6 sm:p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-extrabold text-2xl shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10 mb-1">
              Q
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-white">QUENOXA</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI SALES
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 font-medium">Global Technologies</p>
            </div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto pt-1">
              Sign in with your User ID and password to access the sales platform.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-rose-300 animate-in shake duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* User ID Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                User ID / Login ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="e.g. ashwin or ashwin@quenoxa.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <span className="text-[11px] text-slate-500 cursor-default">
                  Default: <code className="text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">admin123</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0"
                />
                <span>Remember this device</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setLoginId('ashwin');
                  setPassword('admin123');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer text-xs"
              >
                Auto-fill Admin
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Quenoxa</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Helper */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1 font-semibold text-slate-300">
                <KeyRound className="w-3 h-3 text-emerald-400" />
                <span>Quick Sign-In Profiles:</span>
              </span>
              <span className="text-[10px] text-slate-500">Click to fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.loginId}
                  type="button"
                  onClick={() => handleSelectDemo(account)}
                  className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                      {account.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <span className={`px-1.5 py-0.2 rounded-sm border font-medium ${account.badgeColor}`}>
                      {account.role}
                    </span>
                    <span className="font-mono text-slate-500 truncate">@{account.loginId}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Security Note */}
          <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-slate-500 border-t border-slate-800/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted Enterprise Gateway</span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          © 2026 Quenoxa Global Technologies. All rights reserved.
        </p>
      </div>
    </div>
  );
};
