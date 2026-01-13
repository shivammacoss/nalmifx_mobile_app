import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

const AUTH_URL = `${API_URL}/auth`;

const LoginScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Check if user is already logged in
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        navigation.replace('MainTrading');
      }
    } catch (e) {
      console.error('Error checking auth:', e);
    }
    setCheckingAuth(false);
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store user data securely
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      if (data.token) {
        await SecureStore.setItemAsync('token', data.token);
      }
      
      // Navigate to MainTrading screen
      navigation.replace('MainTrading');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00d4aa" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.tabText}>Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Welcome back</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter your password"
        placeholderTextColor="#666"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
      />

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Sign in</Text>
        )}
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>OR SIGN IN WITH</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialContainer}>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}>G</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Text style={styles.socialIcon}></Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.terms}>
        Don't have an account?{' '}
        <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
          Sign up
        </Text>
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#222',
    borderRadius: 25,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 32,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
  },
  activeTabText: {
    color: '#fff',
    fontSize: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotText: {
    color: '#888',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  socialIcon: {
    color: '#fff',
    fontSize: 20,
  },
  terms: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
  link: {
    color: '#fff',
  },
});

export default LoginScreen;
