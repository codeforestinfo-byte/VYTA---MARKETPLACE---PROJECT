import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Shield, Smartphone, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MFAVerifyPage() {
  const { pendingMFA, verifyMFA, error, clearError, logout } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!pendingMFA) {
      navigate('/login', { replace: true });
    }
  }, [pendingMFA, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setVerifying(true);
    clearError();
    try {
      const success = await verifyMFA(fullCode);
      if (success) {
        navigate('/', { replace: true });
      }
    } finally {
      setVerifying(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);
    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  if (!pendingMFA) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7f7] py-8 px-4 font-sans">
      <div className="mb-5">
        <img src="/logo-2-black.png" alt="VYTA" className="h-10 w-auto mx-auto" />
      </div>

      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-[360px] w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Two-Factor Authentication
        </h2>
        <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
          Enter the 6-digit code from your authenticator app to complete sign in.
        </p>

        <div className="mb-4 flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs text-gray-600">
          <Smartphone size={14} className="text-gray-500 shrink-0" />
          <span className="truncate">{pendingMFA.email}</span>
        </div>

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

        <div className="flex justify-center space-x-2 mb-5" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-10 h-11 text-center text-lg font-bold border rounded outline-none transition-colors
                ${digit ? 'border-[#1b73b3] bg-blue-50 text-gray-900' : 'border-gray-400 bg-white text-gray-900'}
                focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={code.join('').length !== 6 || verifying}
          className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] active:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {verifying ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <div className="mt-4 pt-3 border-t border-gray-300">
          <button
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
            className="text-[#1c3d52] hover:underline flex items-center gap-1 font-bold text-[11px] cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Back to login</span>
          </button>
        </div>
      </div>

      <div className="mt-4 max-w-[360px] flex items-start space-x-2 text-[10px] text-gray-400 leading-relaxed">
        <Shield size={12} className="mt-0.5 shrink-0" />
        <p>Open your authenticator app and enter the 6-digit code shown for your VYTA account.</p>
      </div>
    </div>
  );
}
