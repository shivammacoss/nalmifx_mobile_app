import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setEditData({
          firstName: parsed.firstName || '',
          lastName: parsed.lastName || '',
          phone: parsed.phone || '',
        });
      }
    } catch (e) {
      console.error('Error loading user:', e);
    }
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!editData.firstName || !editData.lastName) {
      Alert.alert('Error', 'First name and last name are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          ...editData
        })
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, ...editData };
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        Alert.alert('Success', 'Profile updated successfully');
        setShowEditModal(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    }
    setIsSubmitting(false);
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await SecureStore.getItemAsync('token');
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('Success', 'Password changed successfully');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        Alert.alert('Error', data.message || 'Failed to change password');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to change password');
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.bgCard }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{user?.firstName} {user?.lastName}</Text>
          <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user?.email}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Personal Information</Text>
          
          <View style={[styles.infoItem, { backgroundColor: colors.bgCard }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Full Name</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.firstName} {user?.lastName}</Text>
          </View>
          
          <View style={[styles.infoItem, { backgroundColor: colors.bgCard }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="mail-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email}</Text>
          </View>
          
          <View style={[styles.infoItem, { backgroundColor: colors.bgCard }]}>
            <View style={styles.infoLeft}>
              <Ionicons name="call-outline" size={20} color={colors.textMuted} />
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Phone</Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.phone || 'Not set'}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Settings</Text>
          
          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.bgCard }]} onPress={() => setShowEditModal(true)}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#dc262620' }]}>
                <Ionicons name="create-outline" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionItem, { backgroundColor: colors.bgCard }]} onPress={() => setShowPasswordModal(true)}>
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#dc262620' }]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>First Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary }]}
              value={editData.firstName}
              onChangeText={(text) => setEditData({ ...editData, firstName: text })}
              placeholder="Enter first name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Last Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary }]}
              value={editData.lastName}
              onChangeText={(text) => setEditData({ ...editData, lastName: text })}
              placeholder="Enter last name"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary }]}
              value={editData.phone}
              onChangeText={(text) => setEditData({ ...editData, phone: text })}
              placeholder="Enter phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleUpdateProfile}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Current Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary }]}
              value={passwordData.currentPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary }]}
              value={passwordData.newPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Confirm New Password</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary }]}
              value={passwordData.confirmPassword}
              onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
              onPress={handleChangePassword}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.submitBtnText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  profileCard: { alignItems: 'center', padding: 30, margin: 16, borderRadius: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#000', fontSize: 28, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  userEmail: { color: '#666', fontSize: 14, marginTop: 4 },
  
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { color: '#666', fontSize: 14 },
  infoValue: { fontSize: 14 },
  
  actionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  
  inputLabel: { fontSize: 12, marginBottom: 8, marginTop: 16 },
  input: { borderRadius: 12, padding: 16, fontSize: 16 },
  
  submitBtn: { backgroundColor: '#dc2626', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});

export default ProfileScreen;
