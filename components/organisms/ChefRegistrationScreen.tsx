"use client"

import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from "expo-image-picker"
import { LinearGradient } from "expo-linear-gradient"
import React, { useState } from "react"
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Dialog from "../atoms/Dialog"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

interface ChefRegistrationScreenProps {
  onComplete: (chefData: ChefRegistrationData) => void
  onCancel: () => void
}

export interface ChefRegistrationData {
  chefName: string
  expertiseCategory: string
  professionalSummary: string
  yearsOfExperience: number
  portfolioImage?: string
  agreedToTerms: boolean
}

const EXPERTISE_CATEGORIES = [
  "Baking",
  "Desi Cooking",
  "Knife Skills",
  "Healthy Cooking",
  "Continental",
  "Beginner Fundamentals",
  "Italian Cuisine",
  "Asian Fusion",
  "Desserts & Pastries",
  "Grilling & BBQ",
  "Vegan & Vegetarian",
  "Other"
]

const ChefRegistrationScreen: React.FC<ChefRegistrationScreenProps> = ({ onComplete, onCancel }) => {
  const insets = useSafeAreaInsets()
  
  const [chefData, setChefData] = useState<ChefRegistrationData>({
    chefName: "",
    expertiseCategory: "",
    professionalSummary: "",
    yearsOfExperience: 0,
    portfolioImage: undefined,
    agreedToTerms: false,
  })
  
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showTermsDialog, setShowTermsDialog] = useState(false)

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setChefData({ ...chefData, portfolioImage: result.assets[0].uri })
    }
  }

  const handleSubmit = () => {
    // Validation
    if (!chefData.chefName.trim()) {
      setErrorMessage("Please enter your chef name")
      setShowErrorDialog(true)
      return
    }
    
    if (!chefData.expertiseCategory) {
      setErrorMessage("Please select your expertise category")
      setShowErrorDialog(true)
      return
    }
    
    if (!chefData.professionalSummary.trim()) {
      setErrorMessage("Please provide a professional summary")
      setShowErrorDialog(true)
      return
    }
    
    if (chefData.professionalSummary.trim().length < 50) {
      setErrorMessage("Professional summary should be at least 50 characters")
      setShowErrorDialog(true)
      return
    }
    
    if (chefData.yearsOfExperience < 0) {
      setErrorMessage("Please enter valid years of experience")
      setShowErrorDialog(true)
      return
    }
    
    if (!chefData.agreedToTerms) {
      setErrorMessage("You must agree to the Chef Content Terms")
      setShowErrorDialog(true)
      return
    }

    onComplete(chefData)
  }

  return (
    <LinearGradient
      colors={["#09090b", "#18181b"]}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 0.5 }}
    >
      <KeyboardAvoidingView 
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Become a Chef</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.welcomeTitle}>
                Join Our{'\n'}Chef Community
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Chef Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chef Name / Display Name *</Text>
              <Text style={styles.inputHint}>This is how you'll appear to students</Text>
              <TextInput
                style={styles.textInput}
                value={chefData.chefName}
                onChangeText={(text) => setChefData({ ...chefData, chefName: text })}
                placeholder="e.g., Chef Maria Rodriguez"
                placeholderTextColor="#64748B"
              />
            </View>

            {/* Expertise Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Expertise Category *</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text style={chefData.expertiseCategory ? styles.dropdownButtonTextSelected : styles.dropdownButtonText}>
                  {chefData.expertiseCategory || "Select your primary expertise"}
                </Text>
                <Ionicons 
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={chefData.expertiseCategory ? "#FACC15" : "#64748B"} 
                />
              </TouchableOpacity>
              
              {showCategoryDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {EXPERTISE_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.dropdownItem,
                          chefData.expertiseCategory === category && styles.dropdownItemSelected
                        ]}
                        onPress={() => {
                          setChefData({ ...chefData, expertiseCategory: category })
                          setShowCategoryDropdown(false)
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          chefData.expertiseCategory === category && styles.dropdownItemTextSelected
                        ]}>
                          {category}
                        </Text>
                        {chefData.expertiseCategory === category && (
                          <Ionicons name="checkmark-circle" size={20} color="#FACC15" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Professional Summary */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Professional Summary *</Text>
              <Text style={styles.inputHint}>
                Describe your teaching style and what makes you unique (50-200 characters)
              </Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={chefData.professionalSummary}
                onChangeText={(text) => setChefData({ ...chefData, professionalSummary: text })}
                placeholder="e.g., Passionate about teaching authentic Italian cuisine with 15 years of experience. Specializing in fresh pasta and traditional sauces."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Text style={styles.characterCount}>
                {chefData.professionalSummary.length}/200
              </Text>
            </View>

            {/* Years of Experience */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Years of Experience *</Text>
              <TextInput
                style={styles.textInput}
                value={chefData.yearsOfExperience > 0 ? chefData.yearsOfExperience.toString() : ""}
                onChangeText={(text) => {
                  const num = parseInt(text) || 0
                  setChefData({ ...chefData, yearsOfExperience: num })
                }}
                placeholder="e.g., 5"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
              />
            </View>

            {/* Portfolio Image */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Portfolio Image (Optional)</Text>
              <Text style={styles.inputHint}>A professional photo or cooking image</Text>
              <TouchableOpacity 
                style={[styles.imageUploadBox, chefData.portfolioImage && styles.imageUploadBoxFilled]}
                onPress={handleImagePicker}
              >
                {chefData.portfolioImage ? (
                  <Image source={{ uri: chefData.portfolioImage }} style={styles.uploadedImage} />
                ) : (
                  <View style={styles.imageUploadContent}>
                    <Ionicons name="camera" size={40} color="#64748B" />
                    <Text style={styles.imageUploadText}>Tap to upload image</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.inputGroup}>
              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setChefData({ ...chefData, agreedToTerms: !chefData.agreedToTerms })}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, chefData.agreedToTerms && styles.checkboxActive]}>
                  {chefData.agreedToTerms && (
                    <Ionicons name="checkmark" size={20} color="#000000" />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkboxLabel}>
                    I agree to the Chef Content Terms *
                  </Text>
                  <TouchableOpacity onPress={() => setShowTermsDialog(true)}>
                    <Text style={styles.termsLink}>View Terms & Conditions</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            <TouchableOpacity 
              style={styles.submitButton} 
              onPress={handleSubmit}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={20} color="#D4AF37" />
              <Text style={styles.submitButtonText}>Submit Application</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Error Dialog */}
        <Dialog
          visible={showErrorDialog}
          type="error"
          title="Validation Error"
          message={errorMessage}
          onClose={() => setShowErrorDialog(false)}
          confirmText="OK"
        />

        {/* Terms Dialog */}
        <Dialog
          visible={showTermsDialog}
          type="info"
          title="Chef Content Terms"
          message={`As a chef on our platform, you agree to:

• Upload authentic, original content
• Provide accurate cooking instructions and measurements
• Upload 2 free recipes before uploading premium content
• Maintain quality standards for all content
• Respect copyright and intellectual property
• Engage professionally with the community
• Follow platform guidelines for content creation

Premium content will be reviewed before publication to ensure quality standards are met.`}
          onClose={() => setShowTermsDialog(false)}
          confirmText="I Understand"
        />
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(250, 204, 21, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(250, 204, 21, 0.4)",
  },
  titleContainer: {
    flex: 1,
  },
  welcomeTitle: {
    color: "#D4AF37",
    fontSize: 24,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeDescription: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputHint: {
    color: "#64748B",
    fontSize: 13,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    padding: 16,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  dropdownButton: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownButtonText: {
    color: "#64748B",
    fontSize: 16,
    flex: 1,
  },
  dropdownButtonTextSelected: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  dropdown: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    maxHeight: 240,
    shadowColor: "rgba(0, 0, 0, 0.15)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  dropdownItemSelected: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  dropdownItemText: {
    color: "#FFFFFF",
    fontSize: 15,
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: "#D4AF37",
    fontWeight: "600",
  },
  imageUploadBox: {
    height: 200,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  imageUploadBoxFilled: {
    borderStyle: "solid",
    borderColor: "#D4AF37",
  },
  imageUploadContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  imageUploadText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  checkboxActive: {
    backgroundColor: "#D4AF37",
    borderColor: "#D4AF37",
  },
  checkboxLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 4,
  },
  termsLink: {
    color: "#3B82F6",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  submitButton: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: '#d4af373b',
    borderColor: '#d4af3779',
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    backgroundColor: '#d4af37ff',
    borderRadius: 20,
    gap: 8,
  },
  submitButtonText: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "700",
  },
})

export default ChefRegistrationScreen
