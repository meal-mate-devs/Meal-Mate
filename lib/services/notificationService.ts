import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register for push notifications and get Expo push token
 * @returns {Promise<string|null>} The push token or null if failed
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
    let token: string | null = null;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF6B6B',
        });

        // Create notification channels for different types
        await Notifications.setNotificationChannelAsync('pantry', {
            name: 'Pantry Alerts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4CAF50',
        });

        await Notifications.setNotificationChannelAsync('grocery', {
            name: 'Grocery Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#2196F3',
        });

        await Notifications.setNotificationChannelAsync('chef', {
            name: 'Chef Updates',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF9800',
        });

        await Notifications.setNotificationChannelAsync('community', {
            name: 'Community Activity',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#9C27B0',
        });

        await Notifications.setNotificationChannelAsync('health', {
            name: 'Health Reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#00BCD4',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }

        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
            
            if (!projectId) {
                console.log('Project ID not found');
                return null;
            }

            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Push token:', token);
        } catch (error) {
            console.log('Error getting push token:', error);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Schedule a local notification
 * @param title Notification title
 * @param body Notification body
 * @param data Additional data to pass
 * @param trigger When to trigger the notification
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    data?: any,
    trigger?: Notifications.NotificationTriggerInput
) {
    return await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: true,
        },
        trigger: trigger || null, // null means immediately
    });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Set badge count (iOS)
 */
export async function setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
}

/**
 * Get badge count (iOS)
 */
export async function getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
}
