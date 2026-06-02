import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../features/auth';
import { type AppDispatch, type RootState } from '../store/store';
import { useToast } from '../components/Toast';
import { Button } from '../components/Button';
import { MdAdminPanelSettings, MdPerson, MdTwoWheeler, MdVisibility, MdVisibilityOff } from 'react-icons/md';

import logisticsBg from '../assets/logistics.png';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState<'admin' | 'client' | 'rider'>('client');
  
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleRoleSelect = (role: 'admin' | 'client' | 'rider') => {
    setActiveRole(role);
    // Auto-fill demo credentials based on selection
    if (role === 'admin') setEmail('admin@logistics.com');
    else if (role === 'client') setEmail('client@logistics.com');
    else if (role === 'rider') setEmail('rider1@logistics.com');
    setPassword('password123');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both email and password', 'error');
      return;
    }

    try {
      const resultAction = await dispatch(loginUser({ email, password })).unwrap();
      addToast(`Welcome back, ${resultAction.user.name}!`, 'success');

      if (resultAction.user.role === 'admin') navigate('/dashboard');
      else if (resultAction.user.role === 'client') navigate('/orders');
      else if (resultAction.user.role === 'rider') navigate('/my-deliveries');
    } catch (err) {
      addToast(typeof err === 'string' ? err : 'Invalid credentials', 'error');
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--color-neutral-bg)]">
      {/* Left Side Background */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${logisticsBg})` }}
        />
        <div className="absolute inset-0 bg-slate-950/40 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/40" />
        
        <div className="relative z-10 -ml-2 -mt-12">
          <img src="/image.png" alt="LogisticsPro Logo" className="h-28 w-auto object-contain object-left object-top brightness-0 invert" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-sm inline-block mb-4 uppercase tracking-widest">
            Global Infrastructure
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-[1.1] tracking-tight">
            The Pulse of Global Commerce.
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Precision logistics driven by real-time data and high-performance engineering.
          </p>
        </div>
      </div>

      {/* Right Side Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <img src="/image.png" alt="LogisticsPro Logo" className="h-24 object-contain mx-auto lg:mx-0 lg:hidden -my-4 mb-2" />
            <h3 className="text-2xl font-bold text-[var(--color-primary)] mt-2">Sign in to your account</h3>
            <p className="text-sm text-[var(--color-secondary)] mt-1 font-medium">Enter your details below</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="flex bg-white border border-[var(--color-neutral-light)] p-1 rounded-xl mb-6 shadow-sm">
            <button
              type="button"
              onClick={() => handleRoleSelect('client')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeRole === 'client'
                  ? 'bg-[var(--color-primary-light)]/10 text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <MdPerson size={16} /> Client
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('rider')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeRole === 'rider'
                  ? 'bg-[var(--color-primary-light)]/10 text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <MdTwoWheeler size={16} /> Rider
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('admin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
                activeRole === 'admin'
                  ? 'bg-[var(--color-primary-light)]/10 text-[var(--color-primary)] shadow-sm'
                  : 'text-[var(--color-secondary)] hover:text-[var(--color-primary)]'
              }`}
            >
              <MdAdminPanelSettings size={16} /> Admin
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-primary)] mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-3 py-2.5 bg-white border border-[var(--color-neutral-light)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-transparent transition-all outline-none text-sm text-[var(--color-neutral-text)] placeholder-[var(--color-secondary-light)] shadow-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-primary)] mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-3 pr-10 py-2.5 bg-white border border-[var(--color-neutral-light)] rounded-lg focus:ring-2 focus:ring-[var(--color-primary-light)] focus:border-transparent transition-all outline-none text-sm text-[var(--color-neutral-text)] placeholder-[var(--color-secondary-light)] shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-secondary)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full mt-4 py-2.5" isLoading={loading}>
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-center text-xs text-[var(--color-secondary)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--color-primary)] font-bold hover:underline">
                Register Now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
