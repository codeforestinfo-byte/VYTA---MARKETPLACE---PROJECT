import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { forgotPassword } from '@/src/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [fpError, setFpError] = useState<string | null>(null);
  const [fpSuccess, setFpSuccess] = useState<string | null>(null);
  const [fpSubmitting, setFpSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setFpError('Please enter a valid email address.');
      return;
    }
    setFpSubmitting(true);
    setFpError(null);
    setFpSuccess(null);
    try {
      await forgotPassword(resetEmail);
      setResetSent(true);
      setFpSuccess('Password reset link sent! Check your email.');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        if (err.code === 'auth/user-not-found') {
          setFpError('No admin account found with this email.');
        } else if (err.code === 'auth/invalid-email') {
          setFpError('Please enter a valid email address.');
        } else if (err.code === 'auth/too-many-requests') {
          setFpError('Too many requests. Please try again later.');
        } else {
          setFpError('Failed to send reset email. Try again later.');
        }
      } else {
        setFpError('Failed to send reset email. Try again later.');
      }
    } finally {
      setFpSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    clearError();
    try {
      await login(email, password);
      navigate('/');
    } catch {
      // error is set in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f7] py-8 px-4 font-sans">
      <div className="mb-5">
        <img
          src="/logo-2-black.png"
          alt="VYTA"
          className="h-10 w-auto mx-auto"
        />
      </div>

      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-[360px] w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {showForgotPassword ? 'Reset admin password' : 'Sign in'}
        </h2>
        <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
          {showForgotPassword
            ? 'Enter your admin email and we\'ll send a link to reset your password.'
            : 'Access the VYTA merchant command center — manage vendors, track payouts, moderate products, and monitor real-time marketplace analytics.'}
        </p>

        {error && !showForgotPassword && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-2.5 rounded text-left">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs text-red-800 leading-tight">
                <span className="font-bold">There was a problem</span>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {fpError && showForgotPassword && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-2.5 rounded text-left">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs text-red-800 leading-tight">
                <span className="font-bold">There was a problem</span>
                <p className="mt-0.5">{fpError}</p>
              </div>
            </div>
          </div>
        )}

        {fpSuccess && (
          <div className="mb-4 bg-emerald-50 border-l-4 border-[#1c3d52] p-2.5 rounded text-left">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#1c3d52] mt-0.5 shrink-0" />
              <div className="text-xs text-emerald-800 leading-tight">
                <span className="font-bold">Email Sent</span>
                <p className="mt-0.5">{fpSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {showForgotPassword ? (
          <div className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="admin-reset-email-input">
                Admin Email
              </label>
              <input
                id="admin-reset-email-input"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="admin@vyta.com"
                className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={fpSubmitting || resetSent}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fpSubmitting ? 'Sending...' : resetSent ? 'Sent!' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setFpError(null);
                setFpSuccess(null);
              }}
              className="w-full py-1.5 text-xs text-[#1c3d52] hover:underline font-bold cursor-pointer bg-transparent border-none"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="admin-email-input">
                Email
              </label>
              <input
                id="admin-email-input"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-gray-900" htmlFor="admin-password-input">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                    setResetSent(false);
                    setFpError(null);
                    setFpSuccess(null);
                  }}
                  className="text-[11px] text-[#1c3d52] hover:underline cursor-pointer font-medium bg-transparent border-none"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 5 characters"
                className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] active:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-black" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-xs">
          <div className="flex items-center gap-1">
            <input
              type="checkbox"
              id="admin-keep-signedin"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              className="text-[#1c3d52] h-3.5 w-3.5 focus:ring-[#1c3d52] rounded border-gray-300"
            />
            <label htmlFor="admin-keep-signedin" className="text-gray-700 cursor-pointer text-[11px]">
              Keep me signed in.
            </label>
          </div>

          <div className="mt-4 border-t border-gray-300 pt-3">
            <button
              type="button"
              onClick={() => setShowNeedHelp(!showNeedHelp)}
              className="text-[#1c3d52] hover:underline flex items-center gap-0.5 font-bold text-[11px] cursor-pointer"
            >
              Need help? <span className="text-[10px]">▼</span>
            </button>
            {showNeedHelp && (
              <div className="mt-2 text-gray-500 pl-2 border-l border-[#1c3d52] space-y-1.5 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                    setResetSent(false);
                    setFpError(null);
                    setFpSuccess(null);
                  }}
                  className="hover:underline cursor-pointer text-[11px] bg-transparent border-none text-gray-500 p-0 text-left"
                >
                  Forgot your admin password?
                </button>
                <p className="hover:underline cursor-pointer text-[11px]">Contact support for marketplace access</p>
                <p className="hover:underline cursor-pointer text-[11px]">Two-factor authentication recovery</p>
              </div>
            )}
          </div>

          <div className="mt-3 border-t border-gray-300 pt-3">
            <button
              type="button"
              onClick={() => setShowMoreInfo(!showMoreInfo)}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-0.5 font-medium text-[11px] cursor-pointer"
            >
              About this portal <span className="text-[10px]">{showMoreInfo ? '▲' : '▼'}</span>
            </button>
            {showMoreInfo && (
              <div className="mt-2 text-gray-400 space-y-1 animate-in fade-in duration-150">
                <p className="text-[10px] leading-relaxed">
                  This secure dashboard is intended for authorized VYTA marketplace administrators only. All access is logged and monitored. Unauthorized access or misuse may result in permanent account suspension and legal action.
                </p>
                <p className="text-[10px] leading-relaxed">
                  VYTA Admin Panel v1.0 &mdash; &copy; {new Date().getFullYear()} VYTA Fitness Marketplace. All rights reserved.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-[10px] text-gray-400 text-center max-w-[360px] leading-relaxed">
        By signing in, you agree to VYTA's{' '}
        <span className="text-[#1c3d52] hover:underline cursor-pointer">Administrator Terms</span> and{' '}
        <span className="text-[#1c3d52] hover:underline cursor-pointer">Privacy Policy</span>.
        This system is for authorised personnel only.
      </p>
    </div>
  );
}
