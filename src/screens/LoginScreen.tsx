import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../auth/AuthContext';

const LoginScreen = ({ _navigation }: any) => {
  const { login } = useAuth();

  const signInWithGoogle = async () => {
    try {
      await login();
    } catch (error) {
      Alert.alert('Error', 'Google Sign-In failed');
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/app_icon.jpg')} style={styles.logo} />
      <Text style={styles.headerTitle}>RealYAI</Text>
      <Text style={styles.subtitle}>Leads. Logic. Leverage.</Text>
      <Text style={styles.welcomeText}>Welcome Back</Text>
      <Text style={styles.signInText}>
        Sign in to access your AI-powered real estate dashboard
      </Text>

      <TouchableOpacity style={styles.googleButton} onPress={signInWithGoogle}>
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1F71', // Updated to your primary theme color
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0C4E4',
    marginBottom: 40,
    fontFamily: 'System',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
    fontFamily: 'System',
  },
  signInText: {
    fontSize: 16,
    color: '#A0C4E4',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    fontFamily: 'System',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5D3FD3', // Deep purple from your theme
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
    justifyContent: 'center',
    shadowColor: 'rgba(255, 255, 255, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
});

export default LoginScreen;
