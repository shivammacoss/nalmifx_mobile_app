import React, { useState } from 'react';
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

const SignupScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    phone: '',
    password: '',
  });

  const handleSignup = async () => {
    if (!formData.firstName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${AUTH_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      // Store user data and navigate to MainTrading
      await SecureStore.setItemAsync('user', JSON.stringify(data.user));
      if (data.token) {
        await SecureStore.setItemAsync('token', data.token);
      }
      
      navigation.replace('MainTrading');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={styles.activeTabText}>Sign up</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.tabText}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Create an account</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        placeholderTextColor="#666"
        value={formData.firstName}
        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
      />

      <View style={styles.phoneContainer}>
        <View style={styles.countryCode}>
          <Text style={styles.flag}>🇺🇸</Text>
          <Text style={styles.codeText}>▼</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="(775) 351-6501"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Create password"
        placeholderTextColor="#666"
        secureTextEntry
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
      />

      <TouchableOpacity 
        style={styles.button}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Create an account</Text>
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
        By creating an account, you agree to our{' '}
        <Text style={styles.link}>Terms & Service</Text>
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
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  codeText: {
    color: '#666',
    fontSize: 12,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderLeftWidth: 0,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
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

export default SignupScreen;
