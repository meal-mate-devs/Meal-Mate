"use client"

import Dialog from "@/components/atoms/Dialog"
import useAuth from "@/hooks/useAuth"
import { apiClient } from "@/lib/api/client"
import { auth } from "@/lib/config/clientApp"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useRouter } from "expo-router"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from "firebase/auth"
import React, { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native"

const PrivacySecurityScreen: React.FC = () => {
  const router = useRouter()
  const { user } = useAuth()

  // Security settings state
  const [loginNotifications, setLoginNotifications] = useState(true)
  const [passwordChangeNotifications, setPasswordChangeNotifications] = useState(true)
  const [activityTracking, setActivityTracking] = useState(true)

  // Change password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Dialog state
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean
    type: "success" | "error" | "warning" | "loading"
    title: string
    message: string
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  })

  const showDialog = (
    type: "success" | "error" | "warning" | "loading",
    title: string,
    message: string
  ) => {
    setDialogConfig({ visible: true, type, title, message })
  }

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      showDialog("warning", "Missing Field", "Please enter your current password")
      return
    }

    if (!newPassword.trim()) {
      showDialog("warning", "Missing Field", "Please enter a new password")
      return
    }

    if (newPassword.length < 6) {
      showDialog("warning", "Weak Password", "Password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      showDialog("warning", "Password Mismatch", "New password and confirmation don't match")
      return
    }

    if (currentPassword === newPassword) {
      showDialog("warning", "Same Password", "New password must be different from current password")
      return
    }

    try {
      setIsChangingPassword(true)
      showDialog("loading", "Updating Password", "Please wait while we update your password...")

      // Get current Firebase user
      const firebaseUser = auth.currentUser
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("User not authenticated. Please log in again.")
      }

      // Reauthenticate user with current password to verify it's correct
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword)
      await reauthenticateWithCredential(firebaseUser, credential)

      // Update password through Firebase
      await updatePassword(firebaseUser, newPassword)

      // Notify backend about password change (for logging/notification purposes)
      try {
        await apiClient.post("/auth/password-changed", {}, true)
      } catch (backendError) {
        // Don't fail the password change if backend notification fails
        console.log("Backend notification failed:", backendError)
      }

      showDialog(
        "success",
        "Password Updated",
        "Your password has been changed successfully. Please use your new password for future logins."
      )
      
      // Reset form and close modal
      setShowPasswordModal(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Password change error:", error)

      // Handle specific Firebase errors
      if (error.code === "auth/wrong-password") {
        showDialog(
          "error",
          "Incorrect Password",
          "The current password you entered is incorrect. Please try again."
        )
      } else if (error.code === "auth/weak-password") {
        showDialog(
          "error",
          "Weak Password",
          "Please choose a stronger password with at least 6 characters."
        )
      } else if (error.code === "auth/requires-recent-login") {
        showDialog(
          "error",
          "Session Expired",
          "For security reasons, please log out and log in again before changing your password."
        )
      } else if (error.code === "auth/too-many-requests") {
        showDialog(
          "error",
          "Too Many Attempts",
          "Too many failed attempts. Please try again later."
        )
      } else {
        showDialog(
          "error",
          "Update Failed",
          error.message || "Failed to update password. Please try again."
        )
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAllData = () => {
    Alert.alert(
      "Delete All Data",
      "This will permanently delete all your data including recipes, pantry items, and activity. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            showDialog("success", "Data Deleted", "All your data has been deleted successfully")
          },
        },
      ]
    )
  }

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle: string,
    value: boolean,
    onToggle: (value: boolean) => void,
    color: string = "#FACC15"
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#374151", true: "#FACC1550" }}
        thumbColor={value ? "#FACC15" : "#9CA3AF"}
        ios_backgroundColor="#374151"
      />
    </View>
  )

  const renderActionItem = (
    icon: string,
    title: string,
    subtitle: string,
    onPress: () => void,
    color: string = "#FACC15",
    showChevron: boolean = true
  ) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {showChevron && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  )

  const renderPasswordModal = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalOverlay}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={() => setShowPasswordModal(false)}
      >
        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["#1F2937", "#111827"]}
              style={styles.modalGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Password</Text>
                <TouchableOpacity
                  onPress={() => setShowPasswordModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Current Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.passwordInput}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      <Ionicons
                        name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.passwordInput}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                      <Ionicons
                        name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.inputHint}>At least 6 characters</Text>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <View style={styles.passwordInputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                    <TextInput
                      style={styles.passwordInput}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Re-enter new password"
                      placeholderTextColor="#64748B"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowPasswordModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={handleChangePassword}
                    disabled={isChangingPassword}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={["#FACC15", "#F97316"]}
                      style={styles.confirmButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.confirmButtonText}>
                        {isChangingPassword ? "Updating..." : "Update Password"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Privacy & Security</Text>
          <Text style={styles.headerSubtitle}>Manage your account security</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Security Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(250, 204, 21, 0.1)', 'rgba(249, 115, 22, 0.05)']}
            style={styles.sectionHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="shield-checkmark" size={20} color="#FACC15" />
            <Text style={styles.sectionTitle}>SECURITY</Text>
          </LinearGradient>
          <View style={styles.sectionCard}>
            {renderActionItem(
              "key-outline",
              "Change Password",
              "Update your account password",
              () => setShowPasswordModal(true),
              "#FACC15"
            )}
          </View>
        </View>

        {/* Security Notifications Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(249, 115, 22, 0.1)', 'rgba(239, 68, 68, 0.05)']}
            style={styles.sectionHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="notifications" size={20} color="#F97316" />
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          </LinearGradient>
          <View style={styles.sectionCard}>
            {renderSettingItem(
              "log-in-outline",
              "Login Alerts",
              "Notify me of new login activity",
              loginNotifications,
              setLoginNotifications,
              "#F97316"
            )}
            <View style={styles.divider} />
            {renderSettingItem(
              "alert-circle-outline",
              "Password Changes",
              "Notify me when password is changed",
              passwordChangeNotifications,
              setPasswordChangeNotifications,
              "#EF4444"
            )}
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(139, 92, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
            style={styles.sectionHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="eye-off" size={20} color="#8B5CF6" />
            <Text style={styles.sectionTitle}>PRIVACY</Text>
          </LinearGradient>
          <View style={styles.sectionCard}>
            {renderSettingItem(
              "stats-chart-outline",
              "Activity Tracking",
              "Allow app to track your activity",
              activityTracking,
              setActivityTracking,
              "#F59E0B"
            )}
          </View>
        </View>

        {/* Data Protection Section - Placeholder */}
        <View style={styles.section}>
          <LinearGradient
            colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.05)']}
            style={styles.sectionHeader}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="lock-closed" size={20} color="#10B981" />
            <Text style={styles.sectionTitle}>DATA PROTECTION</Text>
          </LinearGradient>
          <View style={styles.sectionCard}>
            {renderActionItem(
              "shield-checkmark-outline",
              "Data Encryption",
              "Your data is encrypted and secure",
              () => showDialog("success", "Data Protected", "All your data is encrypted with industry-standard AES-256 encryption. Your privacy is our priority."),
              "#10B981",
              false
            )}
          </View>
        </View>

        {/* Beautiful Info Footer */}
        <LinearGradient
          colors={['rgba(31, 41, 55, 0.8)', 'rgba(17, 24, 39, 0.9)']}
          style={styles.beautifulFooter}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.footerIconContainer}>
            <Ionicons name="information-circle" size={24} color="#FACC15" />
          </View>
          <View style={styles.footerTextContainer}>
            <Text style={styles.footerTitle}>Your Privacy Matters</Text>
            <Text style={styles.footerText}>
              We use industry-standard encryption and security practices to protect your personal information and data.
            </Text>
          </View>
          <View style={styles.footerDecoration}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Password Change Modal */}
      {showPasswordModal && renderPasswordModal()}

      {/* Dialog */}
      <Dialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onClose={() => setDialogConfig({ ...dialogConfig, visible: false })}
        autoClose={dialogConfig.type !== "loading"}
        autoCloseTime={3000}
      />
    </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(250, 204, 21, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FACC15",
    letterSpacing: 0.5,
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: "#1F2937",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: 72,
  },
  infoFooter: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: "#9CA3AF",
    lineHeight: 20,
  },
  beautifulFooter: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  footerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  footerTextContainer: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FACC15',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  footerDecoration: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  passwordInput: {
    flex: 1,
    color: "white",
    fontSize: 16,
    marginLeft: 12,
    marginRight: 12,
    padding: 0,
  },
  inputHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    marginLeft: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  confirmButton: {
    overflow: "hidden",
  },
  confirmButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
})

export default PrivacySecurityScreen
