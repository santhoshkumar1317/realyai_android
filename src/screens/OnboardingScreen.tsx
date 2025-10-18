import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../auth/AuthContext';
import { apiService } from '../utils/api';

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    companyName: '',
    phoneNumber: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { completeOnboarding } = useAuth();

  const renderSlide = () => {
    switch (currentSlide) {
      case 0:
        return (
          <View style={styles.slide}>
            <Image
              source={require('../assets/app_icon.jpg')}
              style={styles.logo}
            />
            <Text style={styles.title}>Welcome to RealYAI</Text>
            <Text style={styles.subtitle}>Terms & Conditions</Text>
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.termsText}>
                By using RealYAI, you agree to our terms and conditions.{'\n\n'}
                • All data is stored securely{'\n'}• We respect your privacy
                {'\n'}• Service usage terms apply{'\n\n'}
                Please read our full terms and conditions.
              </Text>
            </ScrollView>
            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxChecked,
                ]}
                onPress={() => setTermsAccepted(!termsAccepted)}
              >
                {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                I accept the terms and conditions
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.button,
                (!termsAccepted || isLoading) && styles.buttonDisabled,
              ]}
              onPress={() => setCurrentSlide(1)}
              disabled={!termsAccepted || isLoading}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 1:
        return (
          <View style={styles.slide}>
            <Image
              source={require('../assets/app_icon.jpg')}
              style={styles.logo}
            />
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Connect with Google</Text>
            <View style={styles.slideContent}>
              <Text style={styles.loginText}>
                Sign in with your Google account to get started with RealYAI
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Loading...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 2:
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.slide}
          >
            <Image
              source={require('../assets/app_icon.jpg')}
              style={styles.logo}
            />
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>Tell us about yourself</Text>
            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.profileText}>
                Please provide your details to complete setup
              </Text>
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    placeholderTextColor="#A0C4E4"
                    value={profileData.username}
                    onChangeText={text =>
                      setProfileData(prev => ({ ...prev, username: text }))
                    }
                    autoCapitalize="none"
                    selectionColor="#FFFFFF"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Company Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your company name"
                    placeholderTextColor="#A0C4E4"
                    value={profileData.companyName}
                    onChangeText={text =>
                      setProfileData(prev => ({ ...prev, companyName: text }))
                    }
                    selectionColor="#FFFFFF"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#A0C4E4"
                    value={profileData.phoneNumber}
                    onChangeText={text =>
                      setProfileData(prev => ({ ...prev, phoneNumber: text }))
                    }
                    keyboardType="phone-pad"
                    selectionColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={[
                styles.button,
                (!profileData.username.trim() ||
                  !profileData.companyName.trim() ||
                  !profileData.phoneNumber.trim() ||
                  isLoading) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleCompleteOnboarding}
              disabled={
                !profileData.username.trim() ||
                !profileData.companyName.trim() ||
                !profileData.phoneNumber.trim() ||
                isLoading
              }
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Loading...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        );

      default:
        return null;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token received.');
      }
      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(
        getAuth(),
        googleCredential,
      );

      if (userCredential.user) {
        const token = await userCredential.user.getIdToken(true);
        if (token) {
          await apiService.setToken(token);
        }
      }

      setCurrentSlide(2);
    } catch (error) {
      Alert.alert('Error', 'Google Sign-In failed. Please try again.');
      console.error('Google Sign-In Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      setIsLoading(true);
      const currentUser = getAuth().currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const response = await apiService.createProfile({
        firebaseUid: currentUser.uid,
        email: currentUser.email,
        username: profileData.username.trim(),
        companyName: profileData.companyName.trim(),
        phoneNumber: profileData.phoneNumber.trim(),
      });
      console.log(response);
      await AsyncStorage.setItem('onboarding_completed', 'true');
      completeOnboarding();
      (navigation as any).navigate('MainTabs');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      if (error.status === 409) {
        await AsyncStorage.setItem('onboarding_completed', 'true');
        completeOnboarding();
        (navigation as any).navigate('MainTabs');
      } else {
        Alert.alert('Error', error.message || 'Failed to complete setup');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {renderSlide()}

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {[0, 1, 2].map(index => (
          <View
            key={index}
            style={[styles.dot, index === currentSlide && styles.activeDot]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71', // Updated to your theme
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 30,
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0C4E4',
    marginBottom: 40,
    textAlign: 'center',
    fontFamily: 'System',
  },
  slideContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
    width: '100%',
  },
  termsText: {
    color: '#A0C4E4',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
    fontFamily: 'System',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#5D3FD3', // Updated to your purple
    marginRight: 10,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#5D3FD3', // Updated
    borderColor: '#5D3FD3',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#A0C4E4',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'System',
  },
  loginText: {
    color: '#A0C4E4',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  profileText: {
    color: '#A0C4E4',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'System',
  },
  button: {
    backgroundColor: '#5D3FD3', // Updated to your purple
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#64748b',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#5D3FD3', // Updated
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    fontFamily: 'System',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent
    borderRadius: 12,
    color: '#FFFFFF',
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    fontFamily: 'System',
  },
});

export default OnboardingScreen;
