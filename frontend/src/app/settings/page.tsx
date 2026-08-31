'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/api';
import { ShieldCheck, User, Mail, LogOut, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500/20 selection:text-blue-900">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Account & Security Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your authenticated profile, security policies, and active sessions.
          </p>
        </div>

        {/* Profile Details Card */}
        <div className="pro-card p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
              <User className="w-4 h-4 text-blue-600" />
              Authenticated Profile
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {user.status}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6 my-6">
            {user.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt={user.name || 'Avatar'}
                className="w-16 h-16 rounded-2xl border-2 border-blue-200 object-cover shadow-md shadow-blue-500/10"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-md shadow-blue-500/10">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-slate-900 truncate">{user.name || 'Authenticated Google User'}</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5 truncate">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google OAuth 2.0 Identity Provider</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold mb-1">User Identifier (UUID)</span>
              <span className="font-mono text-slate-700 select-all text-xs">{user.id}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold mb-1">Registered Since</span>
              <span className="text-slate-700 font-medium">
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Authentication Info */}
        <div className="pro-card p-6 sm:p-8 mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Security & Zero-Password Architecture
          </h2>

          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-slate-700 leading-relaxed space-y-2">
            <p className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Lock className="w-4 h-4 text-blue-600" />
              Cryptographic OIDC Token Verification
            </p>
            <p className="text-slate-600">
              No passwords or hashes exist on this server. Authentication is cryptographically verified on every login session via Google&apos;s immutable <code className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-700 font-mono text-[11px]">sub</code> claim.
            </p>
          </div>
        </div>

        {/* Session Termination Card */}
        <div className="pro-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sign Out Session</h3>
            <p className="text-xs text-slate-500 mt-1">
              Invalidate your active session cookie and log out of this device.
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="btn-ghost-danger text-xs py-2.5 px-5 font-bold gap-2 inline-flex items-center cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </main>
    </div>
  );
}
