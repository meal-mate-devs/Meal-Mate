// Example: How to update your NotificationsScreen.tsx to use real data

import { useNotifications } from '@/hooks/useNotifications';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { View, ActivityIndicator, FlatList, Switch } from 'react-native';
import NotificationCard from '@/components/NotificationCard';

export default function NotificationsScreen() {
  const { 
    notifications,           // Real notifications from backend
    unreadCount,             // Unread count
    loading,                 // Loading state
    fetchNotifications,      // Fetch function
    markAsRead,              // Mark as read
    deleteNotifications,     // Delete function
    preferences,             // User preferences
    updatePreferences,       // Update preferences
    sendTestNotification,    // Send test
  } = useNotifications();

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Refresh notifications when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  // Example: Mark single notification as read
  const handleNotificationPress = async (notificationId: string) => {
    await markAsRead([notificationId]);
    // Navigate to relevant screen based on notification.data
  };

  // Example: Mark all as read
  const handleMarkAllRead = async () => {
    await markAsRead([], true);
  };

  // Example: Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotifications([notificationId]);
  };

  // Example: Toggle notification preference
  const handleTogglePreference = async (key: string, value: boolean) => {
    await updatePreferences({ [key]: value });
  };

  // Now use 'notifications' array instead of mock data
  // The notifications have the same structure as your mock data:
  // {
  //   _id: string,
  //   type: 'pantry' | 'grocery' | 'chef' | 'community' | 'health',
  //   title: string,
  //   message: string,
  //   priority: 'low' | 'medium' | 'high' | 'urgent',
  //   isRead: boolean,
  //   data: any,
  //   createdAt: string
  // }

  return (
    <View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationCard
              notification={item}
              onPress={() => handleNotificationPress(item._id)}
              onDelete={() => handleDeleteNotification(item._id)}
            />
          )}
        />
      )}
    </View>
  );
}

// Notification Settings Example
export function NotificationSettings() {
  const { preferences, updatePreferences } = useNotifications();

  const toggleSetting = async (key: keyof typeof preferences, value: boolean) => {
    await updatePreferences({ [key]: value });
  };

  return (
    <View>
      <Switch
        value={preferences?.pantryExpiry ?? true}
        onValueChange={(value) => toggleSetting('pantryExpiry', value)}
      />
      <Switch
        value={preferences?.groceryDeadline ?? true}
        onValueChange={(value) => toggleSetting('groceryDeadline', value)}
      />
      <Switch
        value={preferences?.chefRecipes ?? true}
        onValueChange={(value) => toggleSetting('chefRecipes', value)}
      />
    </View>
  );
}
