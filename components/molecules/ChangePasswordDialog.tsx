import Dialog from "@/components/atoms/Dialog";
import { auth } from "@/lib/config/clientApp";
import { validatePassword } from "@/lib/utils/passwordValidation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "firebase/auth";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

interface ChangePasswordDialogProps {
  visible: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  visible,
  onClose
}) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Dialog state
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "loading";
    title: string;
    message: string;
  }>({
    visible: false,
    type: "success",
    title: "",
    message: "",
  });

  const showDialog = (
    type: "success" | "error" | "warning" | "loading",
    title: string,
    message: string
  ) => {
    setDialogConfig({ visible: true, type, title, message });
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword.trim()) {
      showDialog("warning", "Missing Field", "Please enter your current password");
      return;
    }

    if (!newPassword.trim()) {
      showDialog("warning", "Missing Field", "Please enter a new password");
      return;
    }

    // Use the comprehensive password validation
    const passwordValidation = validatePassword(newPassword, 8);

    if (!passwordValidation.isValid) {
      showDialog("warning", "Weak Password", passwordValidation.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      showDialog("warning", "Password Mismatch", "New password and confirmation don't match");
      return;
    }

    if (currentPassword === newPassword) {
      showDialog("warning", "Same Password", "New password must be different from current password");
      return;
    }

    try {
      setIsChangingPassword(true);
      showDialog("loading", "Updating Password", "Please wait while we update your password...");

      // Get current Firebase user
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("User not authenticated. Please log in again.");
      }

      // Reauthenticate user with current password to verify it's correct
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password through Firebase
      await updatePassword(firebaseUser, newPassword);

      showDialog(
        "success",
        "Password Updated",
        "Your password has been changed successfully. Please use your new password for future logins."
      );

      // Reset form after short delay
      setTimeout(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        onClose();
      }, 2000);
    } catch (error: any) {
      // Handle specific Firebase errors
      if (error.code === "auth/wrong-password") {
        showDialog(
          "error",
          "Incorrect Password",
          "The current password you entered is incorrect. Please try again."
        );
      } else if (error.code === "auth/weak-password") {
        showDialog(
          "error",
          "Weak Password",
          "Please choose a stronger password with at least 8 characters, including letters and numbers."
        );
      } else if (error.code === "auth/requires-recent-login") {
        showDialog(
          "error",
          "Session Expired",
          "For security reasons, please log out and log in again before changing your password."
        );
      } else if (error.code === "auth/too-many-requests") {
        showDialog(
          "error",
          "Too Many Attempts",
          "Too many failed attempts. Please try again later."
        );
      } else {
        showDialog(
          "error",
          "Update Failed",
          error.message || "Failed to update password. Please try again."
        );
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setDialogConfig({ ...dialogConfig, visible: false });
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleClose}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={{ width: "100%", alignItems: "center" }}
            >
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
                        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
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
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* New Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={styles.passwordInputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
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
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.inputHint}>
                        At least 8 characters with letters and numbers
                      </Text>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Confirm New Password</Text>
                      <View style={styles.passwordInputContainer}>
                        <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
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
                            color="#94A3B8"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={handleClose}
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
      </Modal>

      {/* Dialog for feedback */}
      <Dialog
        visible={dialogConfig.visible}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onClose={() => setDialogConfig({ ...dialogConfig, visible: false })}
        autoClose={dialogConfig.type !== "loading"}
        autoCloseTime={3000}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  modalContainer: {
    width: "85%",
    maxWidth: 600,
    borderRadius: 20,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  modalGradient: {
    padding: 20,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FACC15",
  },
  modalContent: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D1D5DB",
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(31, 41, 55, 0.8)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(250, 204, 21, 0.15)",
  },
  passwordInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    marginLeft: 10,
    marginRight: 10,
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
    gap: 10,
    marginTop: 4,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(31, 41, 55, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.3)",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#D1D5DB",
    textAlign: "center",
  },
  confirmButton: {
    overflow: "hidden",
  },
  confirmButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
  },
});

export default ChangePasswordDialog;
