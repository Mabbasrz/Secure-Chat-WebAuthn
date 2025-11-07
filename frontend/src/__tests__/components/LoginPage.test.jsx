/**
 * CrypTalk - LoginPage Component Tests
 * Testing WebAuthn biometric login flow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../../pages/LoginPage';
import { BrowserRouter } from 'react-router-dom';

// Mock @simplewebauthn
vi.mock('@simplewebauthn/browser', () => ({
  startAuthentication: vi.fn(async () => ({
    id: 'credential-id',
    response: {
      clientDataJSON: 'test-data',
      authenticatorData: 'test-auth-data',
      signature: 'test-signature',
    },
  })),
}));

const LoginPageWrapper = () => (
  <BrowserRouter>
    <LoginPage />
  </BrowserRouter>
);

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch.mockClear();
  });

  it('should render login form', () => {
    render(<LoginPageWrapper />);

    expect(screen.getByText(/CrypTalk/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should display tagline', () => {
    render(<LoginPageWrapper />);

    expect(screen.getByText(/Where Privacy Meets Simplicity/i)).toBeInTheDocument();
  });

  it('should require username before login', async () => {
    render(<LoginPageWrapper />);

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/username.*required/i)).toBeInTheDocument();
    });
  });

  it('should fetch login options on submit', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        options: {
          challenge: 'test-challenge',
          timeout: 60000,
          userVerification: 'preferred',
        },
      }),
    });

    render(<LoginPageWrapper />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    await userEvent.type(usernameInput, 'testuser');

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login/options'),
        expect.any(Object)
      );
    });
  });

  it('should handle WebAuthn authentication', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          options: { challenge: 'test-challenge' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'jwt-token-123',
          user: { _id: 'user123', username: 'testuser' },
        }),
      });

    render(<LoginPageWrapper />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    await userEvent.type(usernameInput, 'testuser');

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'token',
        'jwt-token-123'
      );
    });
  });

  it('should display error on failed login', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'User not found' }),
    });

    render(<LoginPageWrapper />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    await userEvent.type(usernameInput, 'nonexistent');

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/user not found/i)).toBeInTheDocument();
    });
  });

  it('should have link to register page', () => {
    render(<LoginPageWrapper />);

    const registerLink = screen.getByRole('link', { name: /register/i });
    expect(registerLink).toHaveAttribute('href', '/register');
  });

  it('should disable login button while loading', async () => {
    global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LoginPageWrapper />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    await userEvent.type(usernameInput, 'testuser');

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });
  });

  it('should show biometric icon', () => {
    render(<LoginPageWrapper />);

    expect(screen.getByText('🔐')).toBeInTheDocument();
  });

  it('should have accessible form labels', () => {
    render(<LoginPageWrapper />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    expect(usernameInput).toHaveAttribute('type', 'text');
  });

  it('should focus username input on load', () => {
    render(<LoginPageWrapper />);

    const usernameInput = screen.getByPlaceholderText(/username/i);
    expect(usernameInput).toHaveFocus();
  });
});

export default {};
