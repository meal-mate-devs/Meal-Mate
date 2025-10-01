"use client"

import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import React from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"

interface ErrorDisplayProps {
  errorDetails: {
    type: 'network' | 'server' | 'auth' | 'unknown'
    title: string
    message: string
    canRetry: boolean
  }
  onRetry?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorDetails, onRetry, secondaryActionLabel, onSecondaryAction }) => {
  // Get icon and colors based on error type
  const getErrorConfig = () => {
    switch (errorDetails.type) {
      case 'network':
        return {
          icon: 'wifi',
          gradientColors: ['#EF4444', '#DC2626'] as const,
          iconColor: '#FEE2E2'
        }
      case 'server':
        return {
          icon: 'server-outline',
          gradientColors: ['#F59E0B', '#D97706'] as const,
          iconColor: '#FEF3C7'
        }
      case 'auth':
        return {
          icon: 'lock-closed-outline',
          gradientColors: ['#8B5CF6', '#7C3AED'] as const,
          iconColor: '#EDE9FE'
        }
      default:
        return {
          icon: 'alert-circle-outline',
          gradientColors: ['#6B7280', '#4B5563'] as const,
          iconColor: '#F3F4F6'
        }
    }
  }

  const config = getErrorConfig()
  const handleSecondaryAction = onSecondaryAction ?? (() => {})

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 0, 0, 0.9)', 'rgba(0, 0, 0, 0.95)']}
        style={styles.overlay}
      >
        <View style={styles.content}>
          {/* Error Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={config.gradientColors}
              style={styles.iconBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={config.icon as any} size={48} color={config.iconColor} />
            </LinearGradient>
          </View>

          {/* Error Title */}
          <Text style={styles.title}>{errorDetails.title}</Text>

          {/* Error Message */}
          <Text style={styles.message}>{errorDetails.message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {errorDetails.canRetry && onRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FACC15', '#F97316']}
                  style={styles.retryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="refresh-outline" size={20} color="black" />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.closeButton, (!errorDetails.canRetry || !onRetry) && styles.closeButtonFull]}
              onPress={handleSecondaryAction}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>
                {secondaryActionLabel || (errorDetails.canRetry && onRetry ? 'Close' : 'OK')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 320,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retryButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FACC15',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  retryButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  closeButtonFull: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default ErrorDisplay