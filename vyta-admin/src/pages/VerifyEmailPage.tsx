import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, CheckCircle2, Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'invalid'>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setMessage('No verification token provided.');
      return;
    }
    fetch('/api/v1/auth/admin/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully');
        } else {
          setStatus('error');
          setMessage(data.detail || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not connect to server.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f7] py-8 px-4 font-sans">
      <div className="mb-5">
        <img src="/logo-2-black.png" alt="VYTA" className="h-10 w-auto mx-auto" />
      </div>

      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-[360px] w-full text-center">
        {status === 'verifying' && (
          <>
            <Loader2 size={32} className="mx-auto mb-3 text-[#1b73b3] animate-spin" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Verifying your email</h2>
            <p className="text-xs text-gray-500">Please wait...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={40} className="mx-auto mb-3 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Email Verified</h2>
            <p className="text-xs text-gray-500 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer"
            >
              Sign In
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <ShieldAlert size={40} className="mx-auto mb-3 text-red-500" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Verification Failed</h2>
            <p className="text-xs text-red-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer"
            >
              Back to Login
            </button>
          </>
        )}

        {status === 'invalid' && (
          <>
            <ShieldAlert size={40} className="mx-auto mb-3 text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900 mb-1">Invalid Link</h2>
            <p className="text-xs text-gray-500 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
