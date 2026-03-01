/**
 * Authentication Context Provider
 * Manages auth state across the app
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { apiClient } from '../api/client';
import * as authApi from '../api/auth';
import { updateUserProfile } from '../api/users';
import { User, LoginRequest, RegisterRequest, SocialLoginRequest, UserUpdateRequest } from '../types';

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: '717245085455-f4kiundnmolvtka4u6tgpq8vgkoce2sr.apps.googleusercontent.com',
});

// Type for pending social login data
interface PendingSocialLogin {
  provider: 'google' | 'apple';
  token: string;
  name?: string;
  email?: string;
}

// Type for birth data to complete onboarding
interface OnboardingData {
  name: string;
  birth_date: string;
  birth_time: string;
  birth_location?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingSocialLogin: PendingSocialLogin | null;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  socialLogin: (data: SocialLoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: UserUpdateRequest) => Promise<void>;
  handleGoogleSignIn: () => Promise<void>;
  handleAppleSignIn: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  cancelOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    pendingSocialLogin: null,
  });

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Initialize API client (loads token from storage)
      await apiClient.init();

      // If we have a token, fetch user profile
      if (apiClient.getToken()) {
        const user = await authApi.getCurrentUser();
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
          pendingSocialLogin: null,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          pendingSocialLogin: null,
        });
      }
    } catch (error) {
      // Token invalid or expired
      await apiClient.clearToken();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        pendingSocialLogin: null,
      });
    }
  };

  const login = useCallback(async (data: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authApi.login(data);
      const user = await authApi.getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        pendingSocialLogin: null,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await authApi.register(data);
      const user = await authApi.getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        pendingSocialLogin: null,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const socialLogin = useCallback(async (data: SocialLoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.socialLogin(data);

      // Check if user needs to complete onboarding (new social login user)
      if (response.needs_onboarding) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          pendingSocialLogin: {
            provider: data.provider,
            token: data.token,
            name: data.name,
          },
        }));
        return;
      }

      const user = await authApi.getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        pendingSocialLogin: null,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      pendingSocialLogin: null,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!apiClient.getToken()) return;

    try {
      const user = await authApi.getCurrentUser();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      // Token expired
      await logout();
    }
  }, [logout]);

  const updateProfile = useCallback(async (data: UserUpdateRequest) => {
    if (!state.user) {
      throw new Error('No user logged in');
    }

    try {
      const updatedUser = await updateUserProfile(state.user.id, data);
      setState(prev => ({ ...prev, user: updatedUser }));
    } catch (error) {
      throw error;
    }
  }, [state.user]);

  const handleGoogleSignIn = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check if Google Play Services are available (Android)
      await GoogleSignin.hasPlayServices();

      // Sign in with Google
      const response = await GoogleSignin.signIn();

      if (response.type === 'cancelled') {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const idToken = response.data?.idToken;
      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }

      // Send to our API
      await socialLogin({
        provider: 'google',
        token: idToken,
        name: response.data?.user?.name || undefined,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));

      // Handle specific Google Sign-In errors
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled - don't show error
        return;
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign in already in progress
        return;
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play Services not available');
      }

      throw error;
    }
  }, [socialLogin]);

  const handleAppleSignIn = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Check if Apple Sign-In is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Apple Sign-In is not available on this device');
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Failed to get Apple identity token');
      }

      // Construct name from Apple credential
      let name: string | undefined;
      if (credential.fullName?.givenName || credential.fullName?.familyName) {
        name = [credential.fullName?.givenName, credential.fullName?.familyName]
          .filter(Boolean)
          .join(' ');
      }

      // Send to our API
      await socialLogin({
        provider: 'apple',
        token: credential.identityToken,
        name,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));

      // Handle specific Apple Sign-In errors
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled - don't show error
        return;
      }

      throw error;
    }
  }, [socialLogin]);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    if (!state.pendingSocialLogin) {
      throw new Error('No pending social login to complete');
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      // Call social login again with the birth data
      await authApi.socialLogin({
        provider: state.pendingSocialLogin.provider,
        token: state.pendingSocialLogin.token,
        name: data.name,
        birth_date: data.birth_date,
        birth_time: data.birth_time,
        birth_location: data.birth_location,
      });

      const user = await authApi.getCurrentUser();
      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
        pendingSocialLogin: null,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, [state.pendingSocialLogin]);

  const cancelOnboarding = useCallback(() => {
    setState(prev => ({
      ...prev,
      pendingSocialLogin: null,
    }));
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    socialLogin,
    logout,
    refreshUser,
    updateProfile,
    handleGoogleSignIn,
    handleAppleSignIn,
    completeOnboarding,
    cancelOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
