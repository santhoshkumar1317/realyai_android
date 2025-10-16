import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithCredential, signOut, GoogleAuthProvider } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { apiService } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AuthNavigationProp } from '../types/navigation';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId:
    '649493914329-vjl6s02g7iu60b6rlje9lajko2m4m0va.apps.googleusercontent.com', // Web client ID from Firebase console
});

interface AuthState {
  isLoggedIn: boolean;
  user: any;
  isAdminVerified: boolean;
  onboardingCompleted: boolean;
  isLoading: boolean;
  isTokenReady: boolean;
}

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logoutUser: () => Promise<void>;
  setAdminVerified: (verified: boolean) => void;
  getIdToken: () => Promise<string | null>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigation = useNavigation<AuthNavigationProp>();
  const [authState, setAuthState] = useState<AuthState>({
    isLoggedIn: false,
    user: null,
    isAdminVerified: false,
    onboardingCompleted: false,
    isLoading: true,
    isTokenReady: false,
  });

  useEffect(() => {
    // Check onboarding status on app startup
    const checkOnboardingStatus = async () => {
      const status = await AsyncStorage.getItem('onboarding_completed');
      setAuthState(prev => ({
        ...prev,
        onboardingCompleted: status === 'true',
        isLoading: false,
      }));
    };
    checkOnboardingStatus();

    const subscriber = onAuthStateChanged(getAuth(), async user => {
      setAuthState(prev => ({
        ...prev,
        isLoggedIn: !!user,
        user,
        isAdminVerified: false, // Reset admin verification on auth state change
      }));

      // Set up API token when authenticated
      if (user) {
        try {
          const token = await getIdToken();
          if (token) {
            await apiService.setToken(token);
            setAuthState(prev => ({ ...prev, isTokenReady: true }));
            console.log('API token set for user:', user.email);
            console.log('Token length:', token.length, 'characters');
          } else {
            console.warn('No token received from Firebase');
            setAuthState(prev => ({ ...prev, isTokenReady: false }));
          }
        } catch (error) {
          console.error('Error setting API token:', error);
          setAuthState(prev => ({ ...prev, isTokenReady: false }));
        }
      } else {
        await apiService.clearToken();
        setAuthState(prev => ({ ...prev, isTokenReady: false }));
      }
    });
    return subscriber; // unsubscribe on unmount
  }, []);

  const login = async () => {
    try {
      // Get the users ID token
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(
        getAuth(),
        googleCredential,
      );

      if (userCredential.user) {
        const token = await userCredential.user.getIdToken(true);
        if (token) {
          await apiService.setToken(token);
          setAuthState(prev => ({ ...prev, isTokenReady: true }));

          // Check if user exists in the backend
          try {
            const response = await apiService.checkUserExists(
              userCredential.user.uid,
            );
            if (response.exists) {
              // User exists, proceed to main app
              navigation.navigate('MainTabs');
            } else {
              // User does not exist, navigate to onboarding
              navigation.navigate('Onboarding');
            }
          } catch (apiError) {
            console.error('API error checking user:', apiError);
            // Fallback to onboarding if check fails
            navigation.navigate('Onboarding');
          }
        }
      }
    } catch (error) {
      console.error('Detailed login error:', JSON.stringify(error, null, 2));
    }
  };

  const logoutUser = async () => {
    try {
      if (getAuth().currentUser) {
        await signOut(getAuth());
      }
      await GoogleSignin.signOut();
      await apiService.clearToken();
      // Do NOT reset onboardingCompleted on logout
      setAuthState(prev => ({
        ...prev,
        isLoggedIn: false,
        user: null,
        isAdminVerified: false,
        isTokenReady: false,
      }));
      navigation.navigate('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const setAdminVerified = (verified: boolean) => {
    setAuthState(prev => ({ ...prev, isAdminVerified: verified }));
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboarding_completed', 'true');
      setAuthState(prev => ({ ...prev, onboardingCompleted: true }));
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const getIdToken = async (): Promise<string | null> => {
    try {
      const currentUser = getAuth().currentUser;
      if (currentUser) {
        // Force refresh token to ensure it's valid
        const token = await currentUser.getIdToken(true);
        console.log('Firebase ID token retrieved and refreshed');
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logoutUser,
        setAdminVerified,
        getIdToken,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
