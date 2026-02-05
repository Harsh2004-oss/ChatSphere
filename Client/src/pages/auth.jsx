import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!isLogin) {
      // Signup validation
      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords don't match!");
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }

      if (!agreedToTerms) {
        toast.error('Please agree to the terms and conditions');
        return;
      }

      setIsSubmitting(true);

      try {
        await register(formData.username, formData.email, formData.password);
        toast.success('Account created successfully!');
        
        setTimeout(() => {
          navigate('/home');
        }, 800);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Signup failed. Please try again.';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Login validation
      if (!formData.email || !formData.password) {
        toast.error('Please enter both email and password');
        return;
      }

      setIsSubmitting(true);

      try {
        await login(formData.email, formData.password);
        toast.success('Welcome back!');
        
        setTimeout(() => {
          navigate('/home');
        }, 800);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Login failed. Please check your credentials.';
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setAgreedToTerms(false);
    setRememberMe(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  return (
    <div className="auth-page">
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
      <div className="auth-container">
        <div
          className={`auth-image-section ${
            isLogin ? 'login-gradient' : 'signup-gradient'
          }`}
        >
          <div className="image-overlay">
            <h1>{isLogin ? 'Welcome Back!' : 'Join Us Today!'}</h1>
            <p>
              {isLogin
                ? 'Connect with friends and the world around you'
                : 'Create an account and start your journey with us'}
            </p>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-wrapper">
            <div className="logo-container">
              <div className="logo-circle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
            </div>

            <h2 className="auth-title">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <p className="auth-subtitle">
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Fill in your details to get started'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="username">Username</label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    autoComplete="username"
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={
                      isLogin ? 'Enter your password' : 'Create a password'
                    }
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    minLength="6"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      minLength="6"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>
              )}

              {isLogin ? (
                <div className="form-options">
                  <label className="remember-me">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <a href="/forgot-password" className="forgot-password">
                    Forgot Password?
                  </a>
                </div>
              ) : (
                <div className="terms-agreement">
                  <label className="terms-label">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      required
                    />
                    <span>
                      I agree to the <a href="/terms">Terms of Service</a> and{' '}
                      <a href="/privacy">Privacy Policy</a>
                    </span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                className="auth-button"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? 'Please wait...' 
                  : isLogin 
                    ? 'Sign In' 
                    : 'Create Account'}
              </button>
            </form>

            <p className="switch-mode">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={toggleMode} className="switch-button">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}