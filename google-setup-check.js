#!/usr/bin/env node

/**
 * Quick setup script for Google Sign-In development
 * This script helps configure the development environment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 MealMate Google Sign-In Setup Helper');
console.log('=====================================\n');

// Check if running in Expo Go
function checkExpoEnvironment() {
    console.log('📱 Checking environment...');
    
    if (process.env.EXPO_PUBLIC_USE_STATIC === 'true') {
        console.log('⚠️  WARNING: You appear to be running in Expo Go');
        console.log('   Google Sign-In requires a development build');
        console.log('   Please run: eas build --profile development --platform all\n');
        return false;
    }
    
    console.log('✅ Environment check passed\n');
    return true;
}

// Check for required files
function checkRequiredFiles() {
    console.log('📁 Checking required files...');
    
    const requiredFiles = [
        'google-services.json',
        'GoogleService-Info.plist',
        '.env'
    ];
    
    const missingFiles = [];
    
    requiredFiles.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
            missingFiles.push(file);
        }
    });
    
    if (missingFiles.length > 0) {
        console.log('⚠️  Missing files (placeholder files created):');
        missingFiles.forEach(file => console.log(`   - ${file}`));
        console.log('   Update these with real values from Firebase Console\n');
        return false;
    }
    
    console.log('✅ All required files found\n');
    return true;
}

// Check environment variables
function checkEnvironmentVariables() {
    console.log('🔧 Checking environment variables...');
    
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env file not found\n');
        return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
        'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
        'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => 
        !envContent.includes(varName) || envContent.includes(`${varName}=placeholder`)
    );
    
    if (missingVars.length > 0) {
        console.log('⚠️  Missing or placeholder environment variables:');
        missingVars.forEach(varName => console.log(`   - ${varName}`));
        console.log('   Update these with real values from Google Cloud Console\n');
        return false;
    }
    
    console.log('✅ Environment variables configured\n');
    return true;
}

// Main setup check
function main() {
    let allGood = true;
    
    allGood = checkExpoEnvironment() && allGood;
    allGood = checkRequiredFiles() && allGood;
    allGood = checkEnvironmentVariables() && allGood;
    
    if (allGood) {
        console.log('🎉 Your Google Sign-In setup looks good!');
        console.log('   You can now test Google Sign-In in your development build.\n');
    } else {
        console.log('📋 Next Steps:');
        console.log('   1. Follow the GOOGLE_INTEGRATION_GUIDE.md');
        console.log('   2. Update placeholder files with real values');
        console.log('   3. Create a development build: eas build --profile development');
        console.log('   4. Test Google Sign-In on device/simulator\n');
    }
    
    console.log('📖 For detailed setup instructions, see GOOGLE_INTEGRATION_GUIDE.md');
}

main();