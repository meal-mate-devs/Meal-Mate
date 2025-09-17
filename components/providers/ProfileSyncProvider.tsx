import { useAuthContext } from '@/context/authContext';
import { updateGlobalProfile, updateGlobalProfileImage } from '@/hooks/useProfileStore';
import React, { useEffect } from 'react';

/**
 * Component to sync auth context profile data with profile store
 */
export default function ProfileSyncProvider({ children }: { children: React.ReactNode }) {
    const { profile, user } = useAuthContext();

    // Sync profile data from auth context to profile store
    useEffect(() => {
        if (profile) {
            // Format full name from first and last name
            const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
            const profileImageUrl = profile.profileImage?.url || '';

            // Log for debugging
            console.log('ProfileSyncProvider: Syncing profile data', {
                fullName,
                email: profile.email,
                profileImageUrl
            });

            // Convert profile data to format expected by profile store
            updateGlobalProfile({
                name: fullName || profile.userName || (user?.displayName || 'User'),
                email: profile.email || user?.email || ''
            });

            // If profile image URL exists, update it in the store
            if (profileImageUrl) {
                updateGlobalProfileImage(profileImageUrl);
            }

            console.log('ProfileSyncProvider: Profile data synced successfully');
        } else if (user) {
            // Fallback to user data if profile is not available
            console.log('ProfileSyncProvider: Using fallback user data');
            updateGlobalProfile({
                name: user.displayName || 'User',
                email: user.email || ''
            });
        }
    }, [
        profile?.firstName,
        profile?.lastName,
        profile?.userName,
        profile?.email,
        profile?.profileImage?.url,
        user?.displayName,
        user?.email
    ]);

    return <>{children}</>;
}