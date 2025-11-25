import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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
} from 'react-native';

interface GooglePasswordSetupDialogProps {
    visible: boolean;
    onPasswordSet: (password: string) => Promise<void>;
    onSkip?: () => void;
    userName: string;
}

interface PasswordValidation {
    minLength: boolean;
    hasNumber: boolean;
    hasLetter: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
}

const GooglePasswordSetupDialog: React.FC<GooglePasswordSetupDialogProps> = ({
    visible,
    onPasswordSet,
    onSkip,
    userName
}) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Password validation
    const validatePassword = (pwd: string): PasswordValidation => {
        return {
            minLength: pwd.length >= 8,
            hasNumber: /\d/.test(pwd),
            hasLetter: /[a-zA-Z]/.test(pwd),
            hasUpperCase: /[A-Z]/.test(pwd),
            hasLowerCase: /[a-z]/.test(pwd)
        };
    };

    const validation = validatePassword(password);
    const isPasswordValid = validation.minLength && validation.hasNumber && validation.hasLetter;

    const handleSetPassword = async () => {
        setError('');

        // Validation checks
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        if (!isPasswordValid) {
            setError('Password does not meet the requirements');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setIsLoading(true);
            await onPasswordSet(password);
            // Reset form
            setPassword('');
            setConfirmPassword('');
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to set password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        setPassword('');
        setConfirmPassword('');
        setError('');
        if (onSkip) {
            onSkip();
        }
    };

    const renderValidationIndicator = (isValid: boolean, text: string) => (
        <View style={styles.validationItem}>
            <Ionicons
                name={isValid ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={isValid ? '#22C55E' : '#64748B'}
            />
            <Text style={[styles.validationText, isValid && styles.validationTextValid]}>
                {text}
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => {}} // Prevent closing by tapping outside
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                        style={styles.centeredContainer}
                    >
                        <View style={styles.dialogContainer}>
                            <LinearGradient
                                colors={['#1F2937', '#111827']}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {/* Header */}
                                <View style={styles.header}>
                                    <View style={styles.iconContainer}>
                                        <Ionicons name="shield-checkmark" size={32} color="#FACC15" />
                                    </View>
                                    <Text style={styles.title}>Secure Your Account</Text>
                                    <Text style={styles.subtitle}>
                                        Welcome, {userName}! Please create a password to secure your account.
                                    </Text>
                                </View>

                                <ScrollView
                                    style={styles.content}
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                >
                                    {/* Password Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Create Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                            <TextInput
                                                style={styles.input}
                                                value={password}
                                                onChangeText={(text) => {
                                                    setPassword(text);
                                                    setError('');
                                                }}
                                                placeholder="Enter your password"
                                                placeholderTextColor="#64748B"
                                                secureTextEntry={!showPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowPassword(!showPassword)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                                    size={20}
                                                    color="#94A3B8"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Password Strength Indicators */}
                                    <View style={styles.validationContainer}>
                                        <Text style={styles.validationTitle}>Password Requirements:</Text>
                                        {renderValidationIndicator(validation.minLength, 'At least 8 characters')}
                                        {renderValidationIndicator(validation.hasLetter, 'Contains letters')}
                                        {renderValidationIndicator(validation.hasNumber, 'Contains numbers')}
                                        {renderValidationIndicator(
                                            validation.hasUpperCase && validation.hasLowerCase,
                                            'Mix of uppercase and lowercase (recommended)'
                                        )}
                                    </View>

                                    {/* Confirm Password Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Confirm Password</Text>
                                        <View style={styles.passwordContainer}>
                                            <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
                                            <TextInput
                                                style={styles.input}
                                                value={confirmPassword}
                                                onChangeText={(text) => {
                                                    setConfirmPassword(text);
                                                    setError('');
                                                }}
                                                placeholder="Re-enter your password"
                                                placeholderTextColor="#64748B"
                                                secureTextEntry={!showConfirmPassword}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <TouchableOpacity
                                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                            >
                                                <Ionicons
                                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                                    size={20}
                                                    color="#94A3B8"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>

                                    {/* Error Message */}
                                    {error ? (
                                        <View style={styles.errorContainer}>
                                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                                            <Text style={styles.errorText}>{error}</Text>
                                        </View>
                                    ) : null}

                                    {/* Info Box */}
                                    <View style={styles.infoBox}>
                                        <Ionicons name="information-circle" size={20} color="#3B82F6" />
                                        <Text style={styles.infoText}>
                                            You can skip this step now and set a password later from Settings.
                                        </Text>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actions}>
                                        <TouchableOpacity
                                            style={styles.primaryButton}
                                            onPress={handleSetPassword}
                                            disabled={isLoading}
                                            activeOpacity={0.7}
                                        >
                                            <LinearGradient
                                                colors={['#FACC15', '#F97316']}
                                                style={styles.buttonGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Text style={styles.primaryButtonText}>
                                                    {isLoading ? 'Setting Password...' : 'Set Password'}
                                                </Text>
                                            </LinearGradient>
                                        </TouchableOpacity>

                                        {onSkip && (
                                            <TouchableOpacity
                                                style={styles.secondaryButton}
                                                onPress={handleSkip}
                                                disabled={isLoading}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={styles.secondaryButtonText}>Skip for Now</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </ScrollView>
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    backdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    centeredContainer: {
        width: '100%',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dialogContainer: {
        width: '100%',
        maxWidth: 450,
        maxHeight: '90%',
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    gradient: {
        flex: 1,
    },
    header: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FACC15',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#D1D5DB',
        marginBottom: 8,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.15)',
        gap: 10,
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 15,
        paddingVertical: 0,
    },
    validationContainer: {
        backgroundColor: 'rgba(31, 41, 55, 0.6)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.15)',
    },
    validationTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#94A3B8',
        marginBottom: 12,
    },
    validationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    validationText: {
        fontSize: 13,
        color: '#64748B',
    },
    validationTextValid: {
        color: '#22C55E',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#EF4444',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 10,
        padding: 12,
        marginBottom: 24,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18,
    },
    actions: {
        gap: 10,
    },
    primaryButton: {
        borderRadius: 10,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000000',
    },
    secondaryButton: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderWidth: 1,
        borderColor: 'rgba(156, 163, 175, 0.3)',
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#D1D5DB',
    },
});

export default GooglePasswordSetupDialog;
