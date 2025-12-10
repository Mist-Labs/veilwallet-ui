import { API_ENDPOINTS } from '@/config/constants';
import type { LoginCredentials, SignupData, OTPVerification, AuthResponse, APIResponse, User } from '@/types';

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_ENDPOINTS.AUTH;
  }

  /**
   * Register a new user
   */
  async signup(data: SignupData): Promise<APIResponse<AuthResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<APIResponse<AuthResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // For httpOnly cookies
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  /**
   * Request OTP code
   */
  async requestOTP(email: string): Promise<APIResponse<{ message: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OTP request failed',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(data: OTPVerification): Promise<APIResponse<AuthResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OTP verification failed',
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<APIResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  }

  /**
   * Get current user session
   */
  async getCurrentUser(): Promise<APIResponse<User>> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user',
      };
    }
  }

  /**
   * Check if session is valid
   */
  async validateSession(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        method: 'GET',
        credentials: 'include',
      });

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();

