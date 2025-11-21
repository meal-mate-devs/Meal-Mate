/**
 * Password validation utility for user registration and password changes
 */

export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordRequirements {
    minLength: boolean;
    hasNumber: boolean;
    hasLetter: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasSpecialChar: boolean;
}

/**
 * Validates password strength and requirements
 * @param password - The password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns Validation result with errors and strength
 */
export const validatePassword = (password: string, minLength: number = 8): PasswordValidationResult => {
    const errors: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    // Check minimum length
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Check for numbers
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    // Check for letters
    if (!/[a-zA-Z]/.test(password)) {
        errors.push('Password must contain at least one letter');
    }

    // Check for uppercase letters (recommended)
    const hasUpperCase = /[A-Z]/.test(password);
    
    // Check for lowercase letters (recommended)
    const hasLowerCase = /[a-z]/.test(password);

    // Check for special characters (optional but recommended)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    // Determine password strength
    if (errors.length === 0) {
        const strengthScore = [
            password.length >= 12,
            hasUpperCase && hasLowerCase,
            /\d/.test(password),
            hasSpecialChar
        ].filter(Boolean).length;

        if (strengthScore >= 3) {
            strength = 'strong';
        } else if (strengthScore >= 2) {
            strength = 'medium';
        } else {
            strength = 'weak';
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        strength
    };
};

/**
 * Checks individual password requirements
 * @param password - The password to check
 * @param minLength - Minimum password length (default: 8)
 * @returns Object with boolean values for each requirement
 */
export const checkPasswordRequirements = (password: string, minLength: number = 8): PasswordRequirements => {
    return {
        minLength: password.length >= minLength,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
};

/**
 * Validates that two passwords match
 * @param password - First password
 * @param confirmPassword - Second password
 * @returns True if passwords match
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
    return password === confirmPassword && password.length > 0;
};

/**
 * Validates password for Google users setting password for the first time
 * More strict validation to ensure security
 * @param password - The password to validate
 * @param confirmPassword - The confirmation password
 * @returns Validation result
 */
export const validateGoogleUserPassword = (password: string, confirmPassword: string): { isValid: boolean; error: string } => {
    if (!password.trim()) {
        return { isValid: false, error: 'Please enter a password' };
    }

    const validation = validatePassword(password, 8);
    
    if (!validation.isValid) {
        return { isValid: false, error: validation.errors[0] };
    }

    if (password !== confirmPassword) {
        return { isValid: false, error: 'Passwords do not match' };
    }

    return { isValid: true, error: '' };
};

/**
 * Get password strength color for UI display
 * @param strength - Password strength level
 * @returns Color hex code
 */
export const getPasswordStrengthColor = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return '#EF4444'; // Red
        case 'medium':
            return '#F59E0B'; // Amber
        case 'strong':
            return '#10B981'; // Green
        default:
            return '#6B7280'; // Gray
    }
};

/**
 * Get password strength text for UI display
 * @param strength - Password strength level
 * @returns Strength text
 */
export const getPasswordStrengthText = (strength: 'weak' | 'medium' | 'strong'): string => {
    switch (strength) {
        case 'weak':
            return 'Weak';
        case 'medium':
            return 'Medium';
        case 'strong':
            return 'Strong';
        default:
            return '';
    }
};
