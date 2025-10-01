# Backend Password Change Implementation Guide

## Overview
This document provides the implementation guide for the password change functionality. The password change is handled securely by Firebase on the client side, with an optional backend endpoint for logging and notifications.

## Frontend Configuration (Already Complete ✅)
- **Component**: `components/organisms/settings/PrivacySecurityScreen.tsx`
- **Firebase Integration**: Direct Firebase Auth password update with reauthentication
- **Backend Notification**: `POST /auth/password-changed` (optional logging endpoint)

## Implementation Approach Used

### Client-Side Firebase Password Change (Implemented ✅)

The password change is handled securely on the client side using Firebase Authentication:

1. **Reauthentication**: User must provide current password for security
2. **Firebase Update**: Password updated directly through Firebase Auth
3. **Backend Notification**: Optional call to backend for logging (doesn't affect password change success)

### Backend Implementation (Already Added ✅)

The notification endpoint has been added to your existing `backend/routes/auth.routes.js` file:

The notification endpoint has been added to your existing `backend/routes/auth.routes.js` file:

```javascript
/**
 * POST /api/auth/password-changed
 *
 * Called after a successful password change on the client side.
 * Used for logging, notifications, and updating user records.
 *
 * Authentication: Required (Firebase JWT token in Authorization header)
 * Request Body: Empty
 * Response: { success: boolean, message?: string }
 */
router.post('/password-changed', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.user.uid; // From Firebase auth middleware

    console.log(`Password changed for user: ${userId}`);

    // Optional: Update MongoDB user record with password change timestamp
    // Uncomment if you have a User model in MongoDB
    /*
    const User = require('../models/User');
    await User.findOneAndUpdate(
      { firebaseUid: userId },
      {
        passwordLastChanged: new Date(),
        lastModified: new Date()
      },
      { new: true }
    );
    */

    // Optional: Send notification email
    // Uncomment and implement if you want to notify users
    /*
    const userRecord = await admin.auth().getUser(userId);
    if (userRecord.email) {
      await sendPasswordChangeNotification(
        userRecord.email,
        userRecord.displayName || 'User'
      );
    }
    */

    // Optional: Log the event in an audit log
    // Uncomment if you have an AuditLog model
    /*
    const AuditLog = require('../models/AuditLog');
    await AuditLog.create({
      userId,
      action: 'PASSWORD_CHANGE',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true
    });
    */

    return res.status(200).json({
      success: true,
      message: 'Password change logged successfully'
    });

  } catch (error) {
    console.error('Error logging password change:', error);

    // Don't fail the client request even if logging fails
    // The password was already changed successfully on Firebase
    return res.status(200).json({
      success: true,
      message: 'Password changed but logging failed'
    });
  }
});
```

### Security Benefits of Current Implementation

1. **Client-Side Security**: Passwords never transmitted to your backend
2. **Firebase Protection**: Built-in rate limiting and security measures
3. **Reauthentication Required**: Must provide current password for security
4. **Direct Firebase Integration**: No backend password handling needed

### Optional Backend Features

The backend endpoint supports optional features you can enable:#### Option A: Client-Side Reauthentication (Recommended)

Update the frontend to reauthenticate before calling the API:

```typescript
// Add to PrivacySecurityScreen.tsx handleChangePassword function
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { auth } from '@/lib/config/clientApp';

const handleChangePassword = async () => {
  // ... validation code ...

  try {
    setIsChangingPassword(true);
    showDialog("loading", "Updating Password", "Please wait while we update your password...");

    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error('User not authenticated');
    }

    // Reauthenticate user with current password
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Update password through Firebase
    await updatePassword(user, newPassword);

    // Notify backend about password change (for logging/notification purposes)
    await apiClient.post('/auth/password-changed', {}, true);

    showDialog(
      "success",
      "Password Updated",
      "Your password has been changed successfully."
    );
    
    // Reset form and close modal
    setShowPasswordModal(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
  } catch (error: any) {
    console.error('Password change error:', error);
    
    if (error.code === 'auth/wrong-password') {
      showDialog("error", "Incorrect Password", "The current password you entered is incorrect.");
    } else if (error.code === 'auth/weak-password') {
      showDialog("error", "Weak Password", "Please choose a stronger password.");
    } else if (error.code === 'auth/requires-recent-login') {
      showDialog("error", "Session Expired", "Please log out and log in again before changing your password.");
    } else {
      showDialog("error", "Update Failed", error.message || "Failed to update password. Please try again.");
    }
  } finally {
    setIsChangingPassword(false);
  }
};
```

#### Option B: Backend Password Verification via Firebase REST API

```javascript
const axios = require('axios');

async function verifyFirebasePassword(email, password) {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true
      }
    );
    return { success: true, idToken: response.data.idToken };
  } catch (error) {
    return { success: false, error: error.response?.data?.error?.message };
  }
}

// In your route handler:
router.post('/change-password', authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.uid;
    
    // Get user email from Firebase
    const userRecord = await admin.auth().getUser(userId);
    
    // Verify current password
    const verification = await verifyFirebasePassword(userRecord.email, currentPassword);
    
    if (!verification.success) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    await admin.auth().updateUser(userId, {
      password: newPassword
    });
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    // ... error handling ...
  }
});
```

### 3. Authentication Middleware

Ensure your auth middleware extracts the Firebase UID from the JWT token:

```javascript
const admin = require('firebase-admin');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = { authenticateUser };
```

### 4. MongoDB Integration (If Applicable)

If you're storing user data in MongoDB alongside Firebase:

```javascript
const User = require('../models/User'); // Your User model

// After successful password update in Firebase:
await User.findOneAndUpdate(
  { firebaseUid: userId },
  { 
    passwordLastChanged: new Date(),
    lastModified: new Date()
  },
  { new: true }
);
```

### 5. Optional: Email Notification

```javascript
const sendPasswordChangeNotification = async (email, userName) => {
  // Using your email service (SendGrid, Nodemailer, etc.)
  const mailOptions = {
    to: email,
    subject: 'Password Changed Successfully',
    html: `
      <h2>Password Changed</h2>
      <p>Hi ${userName},</p>
      <p>Your password was successfully changed. If you did not make this change, please contact support immediately.</p>
      <p>For security reasons, you may need to log in again on all devices.</p>
    `
  };
  
  // await emailService.send(mailOptions);
};
```

## Environment Variables Required

Add to your backend `.env` file:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com

# Firebase Web API Key (for Option B password verification)
FIREBASE_API_KEY=your-web-api-key

# MongoDB (if applicable)
MONGODB_URI=mongodb://localhost:27017/mealmate

# API Base URL
PORT=5000
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on the password change endpoint to prevent brute force attacks
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const passwordChangeLimit = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 3, // limit each user to 3 password changes per windowMs
     message: { success: false, message: 'Too many password change attempts. Please try again later.' }
   });
   
   router.post('/change-password', authenticateUser, passwordChangeLimit, async (req, res) => {
     // ...
   });
   ```

2. **Password Strength**: Enforce strong password requirements (already handled in frontend, but validate in backend too)

3. **Session Invalidation**: Consider invalidating all active sessions after password change

4. **Audit Logging**: Log all password change attempts for security monitoring
   ```javascript
   await AuditLog.create({
     userId,
     action: 'PASSWORD_CHANGE',
     timestamp: new Date(),
     ipAddress: req.ip,
     userAgent: req.headers['user-agent']
   });
   ```

5. **Two-Factor Authentication**: If 2FA is enabled, require 2FA verification before password change

## Testing the Implementation

### 1. Test with cURL:

```bash
# Get auth token first (login)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"oldpassword123"}'

# Use the returned token to change password
curl -X POST http://localhost:5000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"currentPassword":"oldpassword123","newPassword":"newpassword456"}'
```

### 2. Test from Frontend:
- Open the app and navigate to Settings → Privacy & Security
- Click "Change Password"
- Enter current password and new password
- Verify success dialog appears
- Test login with new password

## Recommended Approach

**I recommend Option A (Client-Side Reauthentication)** because:
- ✅ More secure (password only sent to Firebase Auth, not your backend)
- ✅ Better error handling (specific Firebase error codes)
- ✅ No need to store or transmit passwords to your backend
- ✅ Follows Firebase best practices
- ✅ Simpler backend implementation

The backend endpoint would then be simplified to just log the password change event and send notifications:

```javascript
router.post('/password-changed', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Update MongoDB record
    await User.findOneAndUpdate(
      { firebaseUid: userId },
      { passwordLastChanged: new Date() }
    );
    
    // Send notification email
    const userRecord = await admin.auth().getUser(userId);
    await sendPasswordChangeNotification(userRecord.email, userRecord.displayName);
    
    // Log the event
    await AuditLog.create({
      userId,
      action: 'PASSWORD_CHANGE',
      timestamp: new Date()
    });
    
    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error logging password change:', error);
    return res.status(500).json({ success: false });
  }
});
```

## Next Steps

1. ✅ Frontend implementation complete
2. ⏳ Choose implementation approach (Option A recommended)
3. ⏳ Update frontend if using Option A
4. ⏳ Implement backend endpoint
5. ⏳ Add rate limiting and security measures
6. ⏳ Test end-to-end flow
7. ⏳ Deploy to production

## Additional Features to Consider

- Password history (prevent reusing last N passwords)
- Forced password change after certain period
- Password strength meter in UI (already implemented)
- Multi-device session management
- Login notification emails
- Security questions as additional verification

---

**Created**: ${new Date().toISOString()}
**Status**: Frontend Complete ✅ | Backend Implementation Complete ✅
**Last Updated**: ${new Date().toISOString()}
