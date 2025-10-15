import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/ui/Input';
import { ROUTES } from '../../constants';

// Validation schema
const schema = yup.object({
  email: yup
    .string()
    .email('Invalid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  rememberMe: yup.boolean(),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
  const { login, isAuthenticated, error, clearError, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data) => {
    if (isLocked) return;
    
    setIsLoading(true);
    clearError();
    
    try {
      const result = await login(data);
      
      if (result.success) {
        setLoginAttempts(0);
        navigate(from, { replace: true });
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          setIsLocked(true);
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
          }, 300000); // 5 minutes lockout
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #f8fafb 0%, #ffffff 50%, #f8fafb 100%)' }}>
      {/* Left Side - Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ 
          backgroundImage: 'url(/images/Login.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Image only - overlay removed */}
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full space-y-8">
          {/* Brand Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="/images/FFLogo.webp" 
              alt="Fox Fold Logo"
              className="w-20 h-20 rounded-2xl shadow-2xl object-contain p-2"
            />
          </div>

          {/* Header */}
          <div>
            <h2 className="flex justify-center text-4xl font-bold mb-2" style={{ color: '#233d4d' }}>
              Welcome back
            </h2>
            <p className="flex justify-center text-gray-600 text-base">
              Sign in to access your dashboard and manage operations
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3 text-sm text-red-700 font-medium">{error}</div>
                </div>
              </div>
            )}

            {/* Account locked message */}
            {isLocked && (
              <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="ml-3 text-sm text-orange-700 font-medium">
                    Account temporarily locked due to multiple failed login attempts. 
                    Please try again in 5 minutes.
                  </div>
                </div>
              </div>
            )}

            {/* Login attempts warning */}
            {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
              <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3 text-sm text-yellow-700 font-medium">
                    {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}. 
                    Account will be locked after 5 failed attempts.
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              {/* Email */}
              <Input
                {...register('email')}
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                leftIcon={
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                }
              />

              {/* Password */}
              <Input
                {...register('password')}
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                leftIcon={
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                }
                rightIcon={
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                }
              />

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    {...register('rememberMe')}
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 border-gray-300 rounded transition-colors cursor-pointer"
                    style={{ 
                      accentColor: '#fe7f2d'
                    }}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-medium cursor-pointer">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a
                    href="#"
                    className="font-semibold transition-colors"
                    style={{ color: '#fe7f2d' }}
                    onMouseEnter={(e) => e.target.style.color = '#e56f24'}
                    onMouseLeave={(e) => e.target.style.color = '#fe7f2d'}
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLocked || isLoading}
              className="w-full flex items-center justify-center px-6 py-3.5 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                background: isLocked || isLoading ? '#9ca3af' : 'linear-gradient(135deg, #fe7f2d 0%, #fcab10 100%)',
              }}
              onMouseEnter={(e) => {
                if (!isLocked && !isLoading) {
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-5 rounded-2xl border shadow-sm"
            style={{ 
              background: 'linear-gradient(135deg, rgba(254, 127, 45, 0.05) 0%, rgba(252, 171, 16, 0.05) 100%)',
              borderColor: 'rgba(254, 127, 45, 0.2)'
            }}
          >
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="w-5 h-5 mt-0.5" style={{ color: '#fe7f2d' }} />
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: '#233d4d' }}>Demo Credentials</h3>
                <div className="text-xs space-y-2" style={{ color: '#233d4d' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-semibold">Admin:</span> 
                    <span className="font-mono bg-white px-2 py-1 rounded border" style={{ borderColor: 'rgba(254, 127, 45, 0.2)' }}>admin@laundry.com</span>
                    <span className="hidden sm:inline">/</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border" style={{ borderColor: 'rgba(254, 127, 45, 0.2)' }}>password123</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                    <span className="font-semibold">Cashier:</span> 
                    <span className="font-mono bg-white px-2 py-1 rounded border" style={{ borderColor: 'rgba(254, 127, 45, 0.2)' }}>cashier@laundry.com</span>
                    <span className="hidden sm:inline">/</span>
                    <span className="font-mono bg-white px-2 py-1 rounded border" style={{ borderColor: 'rgba(254, 127, 45, 0.2)' }}>password123</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Link to Landing Page */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Are you a customer?{' '}
              <a
                href={ROUTES.LANDING}
                className="font-semibold transition-colors"
                style={{ color: '#fe7f2d' }}
                onMouseEnter={(e) => e.target.style.color = '#e56f24'}
                onMouseLeave={(e) => e.target.style.color = '#fe7f2d'}
              >
                Visit our website
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
