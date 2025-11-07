import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [particles, setParticles] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Create floating particles animation
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!username) {
        throw new Error('Username required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('Failed to get login options');
      }

      const options = await response.json();
      const assertionResponse = await startAuthentication(options);
      await login(username, assertionResponse, options.challenge);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-white opacity-20 animate-float"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Glassmorphism card */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl">
            {/* Header with icon animation */}
            <div className="text-center mb-8">
              <div className="inline-block mb-4 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-pink-500 blur-lg opacity-75 animate-pulse" />
                <div className="relative text-7xl transform hover:rotate-12 transition-transform duration-300">
                  🔐
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
                CrypTalk
              </h1>
              <p className="text-white/90 font-semibold text-lg mb-2">Where Privacy Meets Simplicity</p>
              <p className="text-white/70 text-sm">✨ Encrypted • Passwordless • Secure ✨</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-white/90">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="relative w-full px-4 py-3 bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-xl focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none backdrop-blur-sm transition-all duration-300"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-300/50 backdrop-blur-sm rounded-xl p-4 animate-shake">
                  <p className="text-white text-sm font-medium flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading || !username}
                className="relative w-full group overflow-hidden rounded-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 transition-all duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative px-6 py-3 flex items-center justify-center font-semibold text-white">
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span className="animate-pulse">Verifying Biometric...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-2">👆</span>
                      <span>Login with Biometric</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Sign up link */}
            <div className="mt-8 pt-6 border-t border-white/20 text-center">
              <p className="text-white/80 text-sm">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-white font-semibold hover:text-pink-200 transition-colors duration-300 relative group"
                >
                  <span className="relative z-10">Sign up</span>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-pink-200 group-hover:w-full transition-all duration-300" />
                </Link>
              </p>
            </div>

            {/* Security badge */}
            <div className="mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center justify-center space-x-2 text-white/70 text-xs">
                <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">End-to-end encrypted • Zero-knowledge • No passwords stored</span>
              </div>
            </div>
          </div>

          {/* Footer branding */}
          <div className="mt-8 text-center">
            <p className="text-white/60 text-sm">
              Powered by <span className="font-semibold text-white">WebAuthn</span> & <span className="font-semibold text-white">NaCl Encryption</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
