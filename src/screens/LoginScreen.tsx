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
    backgroundColor: '#1a0033',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    marginTop: 60,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  signInText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    borderRadius: 10,
    width: '100%',
    paddingVertical: 15,
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default LoginScreen;
