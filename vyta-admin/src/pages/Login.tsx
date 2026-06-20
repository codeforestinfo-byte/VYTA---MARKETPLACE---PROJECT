import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { adminUser, login, error, clearError } = useAuth();

  useEffect(() => {
    if (adminUser) {
      navigate('/', { replace: true });
    }
  }, [adminUser, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  const isEmailUnverified = error?.toLowerCase().includes('email not verified');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    clearError();
    setVerifySent(false);
    await login(email, password);
    setSubmitting(false);
  };

  const handleResendVerification = async () => {
    if (!email || sendingVerification) return;
    setSendingVerification(true);
    try {
      const res = await fetch('/api/v1/auth/admin/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setVerifySent(true);
      }
    } catch {}
    setSendingVerification(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f7] py-8 px-4 font-sans">
      <div className="mb-5">
        <img src="/logo-2-black.png" alt="VYTA" className="h-10 w-auto mx-auto" />
      </div>

      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-[360px] w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Sign in
        </h2>
        <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
          Access the VYTA merchant command center — manage vendors, track payouts, moderate products, and monitor real-time marketplace analytics.
        </p>

        {error && (
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

        {verifySent && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-600 p-2.5 rounded text-left">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="text-xs text-green-800 leading-tight">
                <p>Verification email sent. Check your inbox.</p>
              </div>
            </div>
          </div>
        )}

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
            {submitting ? 'Processing...' : 'Continue'}
          </button>

          {isEmailUnverified && (
            <button
              type="button"
              disabled={sendingVerification}
              onClick={handleResendVerification}
              className="w-full py-2 bg-transparent border border-[#1b73b3] text-[#1b73b3] hover:bg-blue-50 font-bold text-xs rounded transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Mail size={12} />
              {sendingVerification ? 'Sending...' : 'Resend verification email'}
            </button>
          )}
        </form>

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
              <div className="mt-2 text-gray-500 pl-2 border-l border-[#1c3d52] space-y-1.5">
                <p className="hover:underline cursor-pointer text-[11px]">Forgot your admin password?</p>
                <p className="hover:underline cursor-pointer text-[11px]">Contact support for marketplace access</p>
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
