import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Database,
  Sparkles,
  Shield,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  RotateCcw
} from 'lucide-react';
import { SystemSettings } from '../../../shared/types.js';
import { api } from '../services/api';

interface SettingsViewProps {
  onRefreshMetrics: () => void;
  onSeedData: () => void;
  isSeeding?: boolean;
  onResetData?: () => void;
  isResetting?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onRefreshMetrics,
  onSeedData,
  isSeeding,
  onResetData,
  isResetting
}) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form fields
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
      setGeminiModel(data.geminiModel);
      setSupabaseUrl(data.supabaseUrl || '');
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        geminiApiKey: geminiApiKey || undefined,
        geminiModel,
        supabaseUrl: supabaseUrl || undefined,
        supabaseKey: supabaseKey || undefined
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadSettings();
    } catch (err: any) {
      alert(err?.message || 'Failed to save settings');
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Configuration & Governance</h2>
          <p className="text-xs text-slate-500">
            Secure server-side API keys, model parameters, and database synchronization.
          </p>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Platform settings updated successfully!</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Google Gemini AI Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Google Gemini AI Engine</h3>
                <p className="text-slate-500 text-[11px]">Official Google Gen AI SDK Integration</p>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              settings?.geminiApiKeyConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {settings?.geminiApiKeyConfigured ? 'LIVE GEMINI KEY DETECTED' : 'USING DEMO AI FALLBACK'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Gemini API Key:</label>
              <input
                type="password"
                placeholder={settings?.geminiApiKeyConfigured ? '••••••••••••••••••••••••' : 'AIzaSy...'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Stored securely on the backend server. Never exposed to the frontend.
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Model Selection:</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-semibold bg-slate-50 text-slate-900"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended — Verified Live)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Supabase PostgreSQL Configuration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Database & Authentication</h3>
                <p className="text-slate-500 text-[11px]">Local SQLite WAL + Supabase PostgreSQL Cloud Sync</p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              LOCAL SQLITE ACTIVE (WAL MODE)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Supabase Project URL:</label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Supabase Anon / Service Role Key:</label>
              <input
                type="password"
                placeholder="eyJhbGciOi..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Testing & Development Tools */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-subtle space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Demo Data & Workflow Verification</h3>
              <p className="text-slate-500 text-[11px]">Seed sample business prospects to test analysis and script generation immediately.</p>
            </div>
            <button
              type="button"
              onClick={onSeedData}
              disabled={isSeeding}
              className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSeeding ? 'Seeding Records...' : 'Seed Sample Records'}
            </button>
          </div>
        </div>

        {/* Danger Zone: Reset Account to Brand-New State */}
        <div className="bg-rose-50/50 p-6 rounded-xl border border-rose-200 shadow-subtle space-y-4 text-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Danger Zone: Clean Slate Account Reset</h3>
                <p className="text-rose-700/80 text-[11px] mt-0.5 leading-relaxed">
                  Reset the platform to a brand-new account state. This permanently deletes all uploaded files, extracted records, AI business analyses, generated cold call scripts, WhatsApp/Email outreach logs, CRM leads, follow-up tasks, meetings, proposals, and pipeline data.
                </p>
                <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Preserves: 12 Active Quenoxa Service Catalog Solutions & User/Team Accounts</span>
                </div>
              </div>
            </div>

            {onResetData && (
              <button
                type="button"
                onClick={onResetData}
                disabled={isResetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors shadow-xs shrink-0 flex items-center space-x-2 disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Resetting All Data...' : 'Reset All Account Data'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
