import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, Settings, X, AlertCircle, RefreshCw, Terminal } from 'lucide-react';
import { getSupabaseCredentials, saveManualSupabaseCredentials, clearManualSupabaseCredentials } from '../lib/supabase';
import { FULL_SUPABASE_SCHEMA_SQL } from '../lib/schemaSql';

interface SetupNoticeProps {
  onCredentialsUpdated: () => void;
  schemaMissing?: boolean;
  onRetry?: () => void;
  isOpenControlled?: boolean;
  onOpenControlledChange?: (open: boolean) => void;
}

export const SetupNotice: React.FC<SetupNoticeProps> = ({
  onCredentialsUpdated,
  schemaMissing = false,
  onRetry,
  isOpenControlled,
  onOpenControlledChange,
}) => {
  const { url, key, isConfigured } = getSupabaseCredentials();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    setInternalIsOpen(val);
    if (onOpenControlledChange) onOpenControlledChange(val);
  };

  const [activeTab, setActiveTab] = useState<'sql' | 'credentials'>(schemaMissing ? 'sql' : 'credentials');
  const [inputUrl, setInputUrl] = useState(url);
  const [inputKey, setInputKey] = useState(key);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedAdminSql, setCopiedAdminSql] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const adminSqlSnippet = `INSERT INTO public.app_admins (user_id)
SELECT id FROM auth.users WHERE email = 'your-admin@example.com'
ON CONFLICT (user_id) DO NOTHING;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyAdminSql = () => {
    navigator.clipboard.writeText(adminSqlSnippet);
    setCopiedAdminSql(true);
    setTimeout(() => setCopiedAdminSql(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim() || !inputKey.trim()) {
      setSaveStatus('Please provide both Project URL and Anon Key.');
      return;
    }
    saveManualSupabaseCredentials(inputUrl.trim(), inputKey.trim());
    setSaveStatus('Credentials saved successfully!');
    setTimeout(() => {
      setSaveStatus(null);
      setIsOpen(false);
      onCredentialsUpdated();
    }, 800);
  };

  const handleReset = () => {
    clearManualSupabaseCredentials();
    setInputUrl('');
    setInputKey('');
    onCredentialsUpdated();
  };

  // If Supabase is fully configured and schema is in place, stay quiet
  if (isConfigured && !schemaMissing && !isOpen) {
    return null;
  }

  return (
    <>
      {/* Banner 1: Supabase Credentials Missing */}
      {!isConfigured && (
        <div className="bg-[#EDE5FF] border-b border-[#DCCEFF] text-[#493D61] px-4 py-2.5 text-xs sm:text-sm transition-all">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <Database className="w-4 h-4 text-[#81758F] shrink-0" />
              <span>
                <strong>Supabase Connection:</strong> Connect your Supabase project to permanently save and sync guides across devices.
              </span>
            </div>
            <button
              onClick={() => {
                setActiveTab('credentials');
                setIsOpen(true);
              }}
              className="px-3.5 py-1.5 bg-white text-[#493D61] hover:bg-[#FFFDF8] border border-[#DCCEFF] rounded-xl font-semibold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Connect Supabase
            </button>
          </div>
        </div>
      )}

      {/* Banner 2: Connected, but SQL Schema Tables Not Created Yet (PGRST205) */}
      {isConfigured && schemaMissing && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs sm:text-sm transition-all">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-center sm:text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Action Needed:</strong> Your Supabase project is connected, but the database tables have not been created yet. Run the SQL schema to enable cloud saves.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('sql');
                  setIsOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                Copy SQL Migration
              </button>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 rounded-xl font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Check
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Configuration & SQL Drawer Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
          <div className="bg-white border border-[#E9DFF5] rounded-3xl max-w-xl w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-[#81758F] hover:text-[#493D61] p-1.5 rounded-lg hover:bg-[#FFF8EF] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-[#493D61]">
              <div className="w-9 h-9 rounded-xl bg-[#EDE5FF] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#493D61]" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Supabase Database Setup</h2>
                <p className="text-xs text-[#81758F]">Connect your PostgreSQL database & run the SQL schema</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#FFF8EF] border border-[#E9DFF5] rounded-xl mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('sql')}
                className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'sql'
                    ? 'bg-white text-[#493D61] shadow-xs'
                    : 'text-[#81758F] hover:text-[#493D61]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>SQL Migration Script</span>
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === 'credentials'
                    ? 'bg-white text-[#493D61] shadow-xs'
                    : 'text-[#81758F] hover:text-[#493D61]'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>API Credentials</span>
              </button>
            </div>

            {/* Tab 1: SQL Script & Instructions */}
            {activeTab === 'sql' && (
              <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 leading-relaxed">
                  <p className="font-semibold mb-1">How to create your tables in Supabase (1 Minute):</p>
                  <ol className="list-decimal list-inside space-y-1 pl-1">
                    <li>Copy the full SQL schema script below.</li>
                    <li>
                      Open your project at{' '}
                      <a
                        href="https://supabase.com/dashboard/project/_/sql"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold inline-flex items-center gap-0.5"
                      >
                        Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Paste the SQL and click <strong>Run</strong>.</li>
                    <li>Come back here and click <strong>Retry Check</strong>.</li>
                  </ol>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#493D61]">Complete Database Schema (`schema.sql`):</span>
                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1.5 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'SQL Copied to Clipboard!' : 'Copy Full SQL Script'}</span>
                  </button>
                </div>

                <div className="relative">
                  <pre className="bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl p-3 text-[11px] font-mono text-[#493D61] max-h-48 overflow-y-auto leading-relaxed">
                    {FULL_SUPABASE_SCHEMA_SQL}
                  </pre>
                </div>

                <div className="p-3 bg-[#FFF8EF] border border-[#E9DFF5] rounded-xl text-[11px] text-[#81758F] space-y-1.5">
                  <p className="font-semibold text-[#493D61]">Admin Account Authorization Command:</p>
                  <p>After creating your user in Supabase Authentication → Users, run this in SQL Editor:</p>
                  <div className="flex items-center justify-between bg-white border border-[#E9DFF5] rounded-lg p-2 font-mono text-[10px] text-[#493D61]">
                    <span className="truncate">{adminSqlSnippet}</span>
                    <button
                      onClick={handleCopyAdminSql}
                      className="ml-2 text-[#81758F] hover:text-[#493D61] p-1 shrink-0"
                      title="Copy admin query"
                    >
                      {copiedAdminSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {onRetry && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onRetry();
                      }}
                      className="px-4 py-2 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>I Ran the SQL — Check Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Credentials Form */}
            {activeTab === 'credentials' && (
              <form onSubmit={handleSave} className="space-y-3.5 flex-1 overflow-y-auto pr-1">
                <p className="text-xs text-[#81758F] leading-relaxed">
                  Configure your project keys directly below or add them to your <code className="bg-[#FFF8EF] px-1 py-0.5 rounded border border-[#E9DFF5]">.env</code> / Vercel settings:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#493D61] mb-1">
                    Supabase Project URL (VITE_SUPABASE_URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://xyzcompany.supabase.co"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] text-[#493D61]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#493D61] mb-1">
                    Supabase Anon Public Key (VITE_SUPABASE_PUBLISHABLE_KEY)
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-[#FFFDF8] border border-[#E9DFF5] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#DCCEFF] text-[#493D61]"
                  />
                </div>

                {saveStatus && (
                  <div className="flex items-center gap-1.5 text-xs text-[#493D61] bg-[#EDE5FF] px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-[#81758F] shrink-0" />
                    <span>{saveStatus}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-[#E9DFF5]">
                  {isConfigured && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-xs text-rose-600 hover:text-rose-700 px-2 py-1.5"
                    >
                      Reset Credentials
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#D8C5FF] hover:bg-[#cfb9ff] text-[#493D61] font-semibold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Save & Connect
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
