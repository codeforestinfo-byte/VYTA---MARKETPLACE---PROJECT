import React, { useState, useRef } from 'react';
import { ShieldAlert, CheckCircle2, Upload } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import { User } from '../types';
import { api } from '../api';
import { signInWithGoogle, forgotPassword, sendVerificationEmail, auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  initialTab?: 'login' | 'register';
  onCancel: () => void;
}

type LoginMode = 'buyer' | 'vendor';

export default function AuthView({ onAuthSuccess, initialTab = 'login', onCancel }: AuthViewProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'vendor'>('buyer');
  const [loginMode, setLoginMode] = useState<LoginMode>('buyer');
  const [storeName, setStoreName] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // MFA verification state
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaUid, setMfaUid] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [mfaCode, setMfaCode] = useState('');

  // Forgot Password
  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await forgotPassword(resetEmail);
      setResetSent(true);
      setSuccess('Password reset link sent! Check your email.');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        if (err.code === 'auth/user-not-found') {
          setError('No account found with this email.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please enter a valid email address.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many requests. Please try again later.');
        } else {
          setError('Failed to send reset email. Try again later.');
        }
      } else {
        setError('Failed to send reset email. Try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Firebase Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const result = await signInWithGoogle();
      const idToken = await result.user.getIdToken();
      const res = await api.googleLogin(idToken);
      localStorage.setItem('vyta_token', res.access_token);
      const me = await api.getMe();
      const user: User = {
        email: me.email,
        name: me.email.split('@')[0],
        role: me.role === 'vendor' ? 'vendor' : 'buyer',
        emailVerified: me.email_verified,
        mfaEnabled: me.mfa_enabled,
      };
      localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
      setSuccess('Welcome to VYTA!');
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(user);
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      setError(message.includes('popup-closed-by-user') ? 'Sign-in cancelled.' : 'Google sign-in failed.');
      setIsSubmitting(false);
    }
  };

  // MFA Code Verification
  const handleMfaVerify = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.verifyMfa(mfaEmail, password, mfaCode);
      localStorage.setItem('vyta_token', res.access_token);
      const me = await api.getMe();
      const user: User = {
        email: me.email,
        name: me.email.split('@')[0],
        role: 'vendor',
        emailVerified: me.email_verified,
        mfaEnabled: true,
        vendorId: me.id,
      };
      setSuccess('2FA verified! Welcome back.');
      localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(user);
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid verification code.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  const handleMfaCancel = () => {
    setMfaPending(false);
    setMfaCode('');
    setMfaUid('');
    setMfaEmail('');
    setError(null);
  };

  // Vendor-specific fields
  const [vendorFullName, setVendorFullName] = useState('');
  const [emiratesId, setEmiratesId] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactLandline, setContactLandline] = useState('');
  const [address, setAddress] = useState('');
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidEmail = (e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.split('@')[1].includes('.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please provide a valid email address (e.g. name@domain.com).');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (tab === 'register') {
      if (!name || name.trim().length < 2) {
        setError('Please enter your full name (at least 2 characters).');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (role === 'vendor' && !storeName) {
        setError('Please specify your Supplement Brand or Merchant Store Name.');
        return;
      }
      if (role === 'vendor' && !vendorFullName) {
        setError('Please enter your full name.');
        return;
      }
      if (role === 'vendor' && !emiratesId) {
        setError('Please enter your Emirates ID.');
        return;
      }
      if (role === 'vendor' && !contactMobile) {
        setError('Please enter your mobile number.');
        return;
      }
      if (role === 'vendor' && !address) {
        setError('Please enter your address.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (tab === 'register') {
        const nameParts = name.trim().split(' ');

        if (role === 'vendor') {
          const registerData: Parameters<typeof api.registerVendor>[0] = {
            email: trimmedEmail,
            password,
            business_name: storeName,
            full_name: vendorFullName,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
            emirates_id: emiratesId,
            contact_mobile: contactMobile,
            contact_landline: contactLandline || undefined,
            address,
          };

          const res = await api.registerVendor(registerData);
          if ('access_token' in res) {
            localStorage.setItem('vyta_token', res.access_token);
          }

          // Upload business registration document if provided
          if (businessRegFile) {
            try {
              await api.uploadVendorDocument(businessRegFile);
            } catch {
              // document upload optional
            }
          }

          // Sign in client-side to get Firebase Auth session, then trigger verification email
          try {
            await signInWithEmailAndPassword(auth, trimmedEmail, password);
            await sendVerificationEmail();
          } catch {
            api.sendVerificationEmail(trimmedEmail).catch(() => null);
          }

          const vendorId = 'vendor_id' in res ? res.vendor_id : undefined;
          const user: User = {
            email: trimmedEmail,
            name: vendorFullName || name.trim(),
            role: 'vendor',
            emailVerified: false,
            vendorId,
          };

          setSuccess('Vendor account created! Check your email to verify.');
          localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
          setTimeout(() => {
            setIsSubmitting(false);
            onAuthSuccess(user);
          }, 800);
          return;
        }

        // Customer registration
        const registerData: Parameters<typeof api.register>[0] = {
          email: trimmedEmail,
          password,
          role: 'customer',
          name: name.trim(),
          store_role: 'buyer',
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
        };

        const res = await api.register(registerData);
        localStorage.setItem('vyta_token', res.access_token);

        const user: User = {
          email: trimmedEmail,
          name: name.trim(),
          role: 'buyer',
          emailVerified: false,
        };

        setSuccess('Account created! Check your email to verify.');
        localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(user);
        }, 800);
        return;
      }

      // Login flow
      const res = await api.login(trimmedEmail, password);

      // Check if MFA is required (vendor with 2FA enabled)
      if (res.mfa_required) {
        setMfaUid(res.uid || '');
        setMfaEmail(res.email);
        setMfaPending(true);
        setIsSubmitting(false);
        return;
      }

      localStorage.setItem('vyta_token', res.access_token);
      const me = await api.getMe();
      const user: User = {
        email: me.email,
        name: me.email.split('@')[0],
        role: me.role === 'vendor' ? 'vendor' : 'buyer',
        emailVerified: me.email_verified,
        mfaEnabled: me.mfa_enabled,
        vendorId: me.role === 'vendor' ? me.id : undefined,
      };
      setSuccess('Welcome back to VYTA!');
      localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(user);
      }, 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#f7f7f7] py-8 px-4 font-sans" id="auth-container">
      <div className="flex items-center justify-center mb-8 mt-2" onClick={onCancel} id="auth-logo">
        <img src="/logo-2-black.png" alt="Vyta" className="h-12 w-auto" />
      </div>

      {/* Main Card Wrapper */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-[360px] w-full" id="auth-card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 font-display text-left">
          {mfaPending ? 'Two-Factor Authentication' : showForgotPassword ? 'Reset your password' : tab === 'login' ? (loginMode === 'vendor' ? 'Vendor Sign In' : 'Customer Sign In') : 'Create account'}
        </h2>



        {/* Status Messages */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-2.5 rounded text-left" id="auth-error-alert">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div className="text-xs text-red-800 leading-tight">
                <span className="font-bold">There was a problem</span>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border-l-4 border-[#1c3d52] p-2.5 rounded text-left" id="auth-success-alert">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#1c3d52] mt-0.5 shrink-0" />
              <div className="text-xs text-emerald-800 leading-tight">
                <span className="font-bold">Execution Success</span>
                <p className="mt-0.5">{success}</p>
              </div>
            </div>
          </div>
        )}

        {mfaPending ? (
          <div className="space-y-4 text-left" id="mfa-verify-container">
            <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded text-xs text-blue-800">
              <p className="font-bold">Two-Factor Authentication Required</p>
              <p className="mt-1">Enter the 6-digit code from your Microsoft Authenticator app.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="mfa-code-input">
                Verification Code
              </label>
              <input
                id="mfa-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={mfaCode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setMfaCode(digits);
                }}
                placeholder="000000"
                maxLength={6}
                className="w-full border border-gray-400 rounded px-2.5 py-2 text-sm text-center text-lg font-mono tracking-[0.5em] outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>
            <button
              type="button"
              onClick={handleMfaVerify}
              disabled={isSubmitting || mfaCode.length !== 6}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={handleMfaCancel}
              className="w-full py-1.5 text-xs text-[#1c3d52] hover:underline font-bold cursor-pointer bg-transparent border-none"
            >
              Back to sign in
            </button>
          </div>
        ) : showForgotPassword ? (
          <div className="space-y-3.5 text-left">
            <p className="text-xs text-gray-600 mb-1">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="reset-email-input">
                Email
              </label>
              <input
                id="reset-email-input"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isSubmitting || resetSent}
              className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : resetSent ? 'Sent!' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
                setError(null);
                setSuccess(null);
              }}
              className="w-full py-1.5 text-xs text-[#1c3d52] hover:underline font-bold cursor-pointer bg-transparent border-none"
            >
              Back to sign in
            </button>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left" id="auth-form">
          {tab === 'login' && (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Account type
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <label className={`border rounded p-2.5 flex flex-col justify-between cursor-pointer transition ${loginMode === 'buyer' ? 'border-[#1c3d52] bg-[#1c3d52]/10 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="radio" 
                      name="loginMode" 
                      checked={loginMode === 'buyer'} 
                      onChange={() => setLoginMode('buyer')}
                      className="text-[#1c3d52] focus:ring-[#1c3d52] h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-900">Customer Login</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">Browse & purchase supplements</span>
                </label>

                <label className={`border rounded p-2.5 flex flex-col justify-between cursor-pointer transition ${loginMode === 'vendor' ? 'border-[#1c3d52] bg-[#1c3d52]/10 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="radio" 
                      name="loginMode" 
                      checked={loginMode === 'vendor'} 
                      onChange={() => setLoginMode('vendor')}
                      className="text-[#1c3d52] focus:ring-[#1c3d52] h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-900">Vendor Login</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">Manage your store & products</span>
                </label>
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-name-input">
                Your name
              </label>
              <input
                id="auth-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First and last name"
                className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-email-input">
              Email or mobile phone number
            </label>
            <input
              id="auth-email-input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1">
                Choose your store role
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <label className={`border rounded p-2.5 flex flex-col justify-between cursor-pointer transition ${role === 'buyer' ? 'border-[#1c3d52] bg-[#1c3d52]/10 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={role === 'buyer'} 
                      onChange={() => setRole('buyer')}
                      className="text-[#1c3d52] focus:ring-[#1c3d52] h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-900">Buyer</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">Acquire barbell plates, apparel & snacks</span>
                </label>

                <label className={`border rounded p-2.5 flex flex-col justify-between cursor-pointer transition ${role === 'vendor' ? 'border-[#1c3d52] bg-[#1c3d52]/10 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="radio" 
                      name="role" 
                      checked={role === 'vendor'} 
                      onChange={() => setRole('vendor')}
                      className="text-[#1c3d52] focus:ring-[#1c3d52] h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-900">Supplement Vendor</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">List heavy machines, set pricing & sell</span>
                </label>
              </div>
            </div>
          )}

          {tab === 'register' && role === 'vendor' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-150 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-store-input">
                  Supplement Brand or Merchant Store Name
                </label>
                <input
                  id="auth-store-input"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Paramount Squat Gears"
                  className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-vendor-fullname-input">
                  Your Full Name (Legal Name)
                </label>
                <input
                  id="auth-vendor-fullname-input"
                  type="text"
                  value={vendorFullName}
                  onChange={(e) => setVendorFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-emirates-id-input">
                  Emirates ID
                </label>
                <input
                  id="auth-emirates-id-input"
                  type="text"
                  value={emiratesId}
                  onChange={(e) => setEmiratesId(e.target.value)}
                  placeholder="e.g. 784-1990-1234567-8"
                  className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-contact-mobile-input">
                    Mobile Number
                  </label>
                  <input
                    id="auth-contact-mobile-input"
                    type="tel"
                    value={contactMobile}
                    onChange={(e) => setContactMobile(e.target.value)}
                    placeholder="+971 50 000 0000"
                    className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-contact-landline-input">
                    Landline Number
                  </label>
                  <input
                    id="auth-contact-landline-input"
                    type="tel"
                    value={contactLandline}
                    onChange={(e) => setContactLandline(e.target.value)}
                    placeholder="+971 4 000 0000"
                    className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-address-input">
                  Address
                </label>
                <textarea
                  id="auth-address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, building, city, emirate"
                  rows={2}
                  className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-900 mb-1">
                  Business Registration Document (PDF)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-400 rounded p-3 text-center cursor-pointer hover:border-[#1c3d52] transition"
                >
                  <Upload className="h-5 w-5 mx-auto text-gray-400 mb-1" />
                  <p className="text-[10px] text-gray-500">
                    {businessRegFile ? businessRegFile.name : 'Click to upload your business registration PDF'}
                  </p>
                  {businessRegFile && (
                    <p className="text-[10px] text-green-600 mt-1">
                      {(businessRegFile.size / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.type !== 'application/pdf') {
                        setError('Only PDF files are allowed.');
                        return;
                      }
                      setBusinessRegFile(file);
                      setError(null);
                    }
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-gray-900" htmlFor="auth-password-input">
                Password
              </label>
              {tab === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                    setResetSent(false);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-xs text-[#1c3d52] hover:underline cursor-pointer bg-transparent border-none"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <input
              id="auth-password-input"
              type="password"
              value={password}
              placeholder="At least 5 characters"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
            />
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-gray-900 mb-1" htmlFor="auth-confirm-password-input">
                Re-enter password
              </label>
              <input
                id="auth-confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-400 rounded px-2.5 py-1.5 text-sm outline-none focus:border-[#1c3d52] focus:shadow-[0_0_0_3px_rgba(0,94,42,0.15)]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-[#1b73b3] hover:bg-[#145a8a] active:bg-[#145a8a] text-black font-extrabold text-xs rounded shadow transition cursor-pointer text-center mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            id="auth-submit-button"
          >
            {isSubmitting ? 'Processing...' : tab === 'login' ? 'Continue' : 'Create your VYTA account'}
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <span className="relative px-3 bg-white text-xs text-gray-500 font-medium">
              or
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 border border-gray-400 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </form>
        )}

        {tab === 'login' && (
          <div className="mt-4 text-xs">
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                id="checkbox-keep-signedin"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="text-[#1c3d52] h-3.5 w-3.5 focus:ring-[#1c3d52] rounded border-gray-300"
              />
              <label htmlFor="checkbox-keep-signedin" className="text-gray-700 cursor-pointer">
                Keep me signed in.
              </label>
            </div>

            <div className="mt-4 border-t border-gray-150 pt-3">
              <button
                onClick={() => setShowNeedHelp(!showNeedHelp)}
                className="text-[#1c3d52] hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                id="need-help-toggle"
              >
                Need help? <span className="text-[10px]">▼</span>
              </button>
              {showNeedHelp && (
                <div className="mt-2 text-gray-500 pl-2 border-l border-[#1c3d52] space-y-1.5 animate-in fade-in duration-150">
                  <p className="hover:underline cursor-pointer">Forgot your gym security password?</p>
                  <p className="hover:underline cursor-pointer">Other issues with multi-vendor registration?</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'register' && (
          <p className="text-[11px] text-gray-500 mt-4 leading-tight text-left">
            By creating an account, you agree to VYTA's{' '}
            <span className="text-[#1c3d52] hover:underline cursor-pointer">Conditions of Supplement Sale</span> and{' '}
            <span className="text-[#1c3d52] hover:underline cursor-pointer">Privacy Notice</span>.
          </p>
        )}
      </div>

      {tab === 'login' ? (
        <div className="mt-5 w-full max-w-[360px] text-center" id="auth-to-register-container">
          <div className="relative flex items-center justify-center mb-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <span className="relative px-3 bg-[#f7f7f7] text-xs text-gray-500 font-medium">
              New to VYTA?
            </span>
          </div>
          <button
            onClick={() => setTab('register')}
            className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:text-gray-900 transition cursor-pointer"
            id="auth-switch-to-register"
          >
            Create your VYTA account
          </button>
        </div>
      ) : (
        <div className="mt-4 text-xs text-gray-700" id="auth-to-login-container">
          Already have a VYTA account?{' '}
          <button
            onClick={() => setTab('login')}
            className="text-[#1c3d52] font-bold hover:underline cursor-pointer"
            id="auth-switch-to-login"
          >
            Sign in
          </button>
        </div>
      )}

      <button
        onClick={onCancel}
        className="mt-6 text-xs text-[#1c3d52] hover:underline font-bold cursor-pointer"
        id="auth-back-to-mall"
      >
        Cancel & Back to Nutrition Marketplace
      </button>
    </div>
  );
}
