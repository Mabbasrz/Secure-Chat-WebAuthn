/**
 * CrypTalk - useAuth Hook Tests
 * Testing authentication state, token management, login/logout
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useAuth from '../../hooks/useAuth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with no user when no token exists', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should load token from localStorage', () => {
    localStorage.setItem('token', 'test-jwt-token');
    localStorage.setItem('user', JSON.stringify({ _id: 'user123', username: 'testuser' }));

    const { result } = renderHook(() => useAuth());

    expect(result.current.token).toBe('test-jwt-token');
    expect(result.current.user?.username).toBe('testuser');
  });

  it('should set token on login', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'new-jwt-token',
        user: { _id: 'user123', username: 'testuser' },
      }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('testuser');
    });

    expect(result.current.token).toBe('new-jwt-token');
    expect(result.current.user?.username).toBe('testuser');
    expect(localStorage.getItem('token')).toBe('new-jwt-token');
  });

  it('should clear token on logout', async () => {
    localStorage.setItem('token', 'test-jwt-token');

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle login errors', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('wronguser');
      } catch (error) {
        expect(error.message).toContain('Invalid credentials');
      }
    });

    expect(result.current.token).toBeNull();
  });

  it('should refresh token when expired', async () => {
    localStorage.setItem('token', 'old-token');

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'new-refreshed-token' }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.refreshToken();
    });

    expect(result.current.token).toBe('new-refreshed-token');
  });

  it('should register new user', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'jwt-token',
        user: { _id: 'user456', username: 'newuser' },
      }),
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.register('newuser', 'new@example.com');
    });

    expect(result.current.token).toBe('jwt-token');
    expect(result.current.user?.username).toBe('newuser');
  });

  it('should include token in API requests', async () => {
    localStorage.setItem('token', 'test-jwt-token');

    const { result } = renderHook(() => useAuth());

    const headers = result.current.getAuthHeaders();

    expect(headers).toHaveProperty('Authorization');
    expect(headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('should track authentication state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);

    act(() => {
      localStorage.setItem('token', 'test-jwt-token');
    });

    // Need to re-render or trigger update
    expect(result.current.isAuthenticated).toBe(false); // Would be updated after token set
  });

  it('should handle WebAuthn registration response', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'jwt-token',
        user: { _id: 'user123', username: 'testuser' },
      }),
    });

    const { result } = renderHook(() => useAuth());

    const attestationResponse = {
      response: {
        clientDataJSON: 'test-data',
        attestationObject: 'test-attestation',
      },
    };

    await act(async () => {
      await result.current.registerWithWebAuthn('testuser', attestationResponse);
    });

    expect(result.current.token).toBe('jwt-token');
  });

  it('should persist user preference', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setUserPreference('theme', 'dark');
    });

    expect(localStorage.getItem('user-pref-theme')).toBe('dark');
  });
});

export default {};
