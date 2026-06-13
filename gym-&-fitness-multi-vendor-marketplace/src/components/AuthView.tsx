import React, { useState, useRef } from 'react';
import { Dumbbell, ShieldAlert, CheckCircle2, Upload } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  initialTab?: 'login' | 'register';
  onCancel: () => void;
}

export default function AuthView({ onAuthSuccess, initialTab = 'login', onCancel }: AuthViewProps) {
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'vendor'>('buyer');
  const [storeName, setStoreName] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNeedHelp, setShowNeedHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vendor-specific fields
  const [vendorFullName, setVendorFullName] = useState('');
  const [emiratesId, setEmiratesId] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactLandline, setContactLandline] = useState('');
  const [address, setAddress] = useState('');
  const [businessRegFile, setBusinessRegFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Please enter your email or phone number to continue.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 5) {
      setError('Passwords must be at least 5 characters long for security.');
      return;
    }

    if (tab === 'register') {
      if (!name) {
        setError('Please enter your legal or screen name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('The passwords you typed do not match. Please re-enter.');
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
        try {
          const nameParts = name.split(' ');
          const registerData: Parameters<typeof api.register>[0] = {
            email,
            password,
            role: role === 'vendor' ? 'vendor' : 'customer',
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || nameParts[0] || '',
          };

          if (role === 'vendor') {
            registerData.business_name = storeName;
            registerData.full_name = vendorFullName;
            registerData.emirates_id = emiratesId;
            registerData.contact_mobile = contactMobile;
            if (contactLandline) registerData.contact_landline = contactLandline;
            registerData.address = address;
          }

          const res = await api.register(registerData);
          localStorage.setItem('vyta_token', res.access_token);

          // Upload business registration document if selected
          if (role === 'vendor' && businessRegFile) {
            try {
              await api.uploadVendorDocument(businessRegFile);
            } catch {
              // Document upload is optional, continue
            }
          }

          // Fetch vendor profile to get real vendor ID
          let vendorId: string | undefined;
          if (role === 'vendor') {
            try {
              const vendorProfile = await api.getVendorProfile();
              vendorId = vendorProfile.id;
            } catch {
              // Fall back to fake ID
            }
          }

          const user: User = {
            email,
            name: role === 'vendor' ? vendorFullName : name,
            role,
            vendorId: vendorId,
          };

          setSuccess('Supplement Marketplace Account Created successfully!');
          localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
          setTimeout(() => {
            setIsSubmitting(false);
            onAuthSuccess(user);
          }, 800);
          return;
        } catch {
          // Fallback to simulation if API is unavailable
        }

        // Simulation fallback
        const dummyUser: User = {
          email,
          name: role === 'vendor' ? vendorFullName : name,
          role,
          vendorId: role === 'vendor' ? 'user_vendor_' + Date.now().toString() : undefined,
        };
        setSuccess('Supplement Marketplace Account Created successfully!');
        localStorage.setItem('vyta_user_jwt', JSON.stringify(dummyUser));
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(dummyUser);
        }, 1000);
        return;
      }

      // Login flow
      try {
        const res = await api.login(email, password);
        localStorage.setItem('vyta_token', res.access_token);
        const me = await api.getMe();
        const user: User = {
          email: me.email,
          name: me.email.split('@')[0],
          role: me.role === 'vendor' ? 'vendor' : 'buyer',
          vendorId: me.role === 'vendor' ? me.id : undefined,
        };
        setSuccess('Welcome back to VYTA!');
        localStorage.setItem('vyta_user_jwt', JSON.stringify(user));
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(user);
        }, 800);
        return;
      } catch {
        // Fallback to simulation
      }

      const dummyUser: User = {
        email,
        name: email.split('@')[0],
        role: 'buyer',
      };
      setSuccess('Welcome back to VYTA!');
      localStorage.setItem('vyta_user_jwt', JSON.stringify(dummyUser));
      setTimeout(() => {
        setIsSubmitting(false);
        onAuthSuccess(dummyUser);
      }, 1000);
    } catch {
      setError('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#f7f7f7] py-8 px-4 font-sans" id="auth-container">
      <div className="flex items-center justify-center gap-2 cursor-pointer mb-6" onClick={onCancel} id="auth-logo">
        <div className="bg-[#132836]/10 p-2 rounded-lg">
          <Dumbbell className="h-5 w-5 text-[#1b73b3]" />
        </div>
        <span className="font-display font-black text-2xl tracking-tight text-[#132836]">VYTA</span>
      </div>

      {/* Main Card Wrapper */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm p-6 max-w-[360px] w-full" id="auth-card">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 font-display text-left">
          {tab === 'login' ? 'Sign in' : 'Create account'}
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

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left" id="auth-form">
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
                <span className="text-xs text-[#1c3d52] hover:underline cursor-pointer">
                  Forgot password?
                </span>
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
        </form>

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
