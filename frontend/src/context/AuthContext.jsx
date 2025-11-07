import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('auth_token');
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize - verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token invalid
            sessionStorage.removeItem('auth_token');
            setToken(null);
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          sessionStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    verifyToken();
  }, []);

  const register = useCallback(async (username, email, attestationResponse, challenge) => {
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          attestationResponse,
          challenge,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      const newToken = data.token;

      setToken(newToken);
      setUser(data.user);
      sessionStorage.setItem('auth_token', newToken);

      navigate('/chat');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [navigate]);

  const login = useCallback(async (username, assertionResponse, challenge) => {
    try {
      setError(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          assertionResponse,
          challenge,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      const newToken = data.token;

      setToken(newToken);
      setUser(data.user);
      sessionStorage.setItem('auth_token', newToken);

      navigate('/chat');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('naCl_secretKey');
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
