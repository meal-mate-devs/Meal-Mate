import * as ImagePicker from 'expo-image-picker';

export const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
export const phoneRegex = /^\+?[0-9]{10,15}$/;

interface ValidationErrors {
    emailError?: string;
    usernameError?: string;
    firstNameError?: string;
    lastNameError?: string;
    ageError?: string;
    genderError?: string;
    dateOfBirthError?: string;
    phoneError?: string;
    passwordError?: string;
    confirmPasswordError?: string;
}

export const validateSignupForm = (
    email: string,
    username: string,
    firstName: string,
    lastName: string,
    age: string,
    gender: string,
    dateOfBirth: string,
    phoneNumber: string,
    password: string,
    confirmPassword: string
): { errors: ValidationErrors; hasError: boolean } => {
    const errors: ValidationErrors = {};
    let hasError = false;

    if (!email.trim()) {
        errors.emailError = 'Please enter your email address';
        hasError = true;
    } else if (!emailRegex.test(email)) {
        errors.emailError = 'Please enter a valid email address';
        hasError = true;
    }

    if (!username.trim()) {
        errors.usernameError = 'Please enter a username';
        hasError = true;
    }

    if (!firstName.trim()) {
        errors.firstNameError = 'Please enter your first name';
        hasError = true;
    }

    if (!lastName.trim()) {
        errors.lastNameError = 'Please enter your last name';
        hasError = true;
    }

    if (!age.trim()) {
        errors.ageError = 'Please enter your age';
        hasError = true;
    } else {
        const ageNumber = parseInt(age);
        if (isNaN(ageNumber)) {
            errors.ageError = 'Age must be a number';
            hasError = true;
        } else if (ageNumber < 13) {
            errors.ageError = 'You must be at least 13 years old';
            hasError = true;
        } else if (ageNumber > 120) {
            errors.ageError = 'Please enter a valid age';
            hasError = true;
        }
    }

    if (!gender) {
        errors.genderError = 'Please select your gender';
        hasError = true;
    }

    if (!dateOfBirth.trim()) {
        errors.dateOfBirthError = 'Please enter your date of birth';
        hasError = true;
    } else {
        // Check if date is valid - handle DD-MM-YYYY format
        let dobDate;
        
        try {
            // Check if dateOfBirth is in DD-MM-YYYY format
            if (typeof dateOfBirth === 'string' && dateOfBirth.includes('-') && dateOfBirth.length === 10) {
                const [day, month, year] = dateOfBirth.split('-').map(Number);
                dobDate = new Date(year, month - 1, day); // month is 0-indexed
            } else {
                dobDate = new Date(dateOfBirth);
            }
        } catch (error) {
            dobDate = new Date('Invalid');
        }
        
        if (isNaN(dobDate.getTime())) {
            errors.dateOfBirthError = 'Please enter a valid date in DD-MM-YYYY format';
            hasError = true;
        } else {
            // Check if user is at least 13 years old
            const today = new Date();
            const thirteenYearsAgo = new Date();
            thirteenYearsAgo.setFullYear(today.getFullYear() - 13);

            if (dobDate > thirteenYearsAgo) {
                errors.dateOfBirthError = 'You must be at least 13 years old';
                hasError = true;
            } else if (dobDate < new Date('1900-01-01')) {
                errors.dateOfBirthError = 'Please enter a valid date of birth';
                hasError = true;
            }
        }
    }

    if (!phoneNumber.trim()) {
        errors.phoneError = 'Please enter your phone number';
        hasError = true;
    } else if (!phoneRegex.test(phoneNumber)) {
        errors.phoneError = 'Please enter a valid phone number';
        hasError = true;
    }

    if (!password.trim()) {
        errors.passwordError = 'Please enter a password';
        hasError = true;
    } else if (password.length < 6) {
        errors.passwordError = 'Password must be at least 6 characters long';
        hasError = true;
    }

    if (password !== confirmPassword) {
        errors.confirmPasswordError = 'Passwords do not match';
        hasError = true;
    }

    return { errors, hasError };
};

export const getProfileImagePermission = async (type: 'camera' | 'gallery') => {
    if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            return { granted: false, error: 'Permission to access camera is required!' };
        }
    } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return { granted: false, error: 'Permission to access camera roll is required!' };
        }
    }
    return { granted: true };
};