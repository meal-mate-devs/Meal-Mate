import { apiClient } from '@/lib/api/client';
import {
    registerForPushNotificationsAsync,
    setBadgeCount
} from '@/lib/services/notificationService';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';
import useAuth from './useAuth';

export interface NotificationPreferences {
    enabled: boolean;
    pantryExpiry: boolean;
    groceryDeadline: boolean;
    chefRecipes: boolean;
    chefCourses: boolean;
    communityActivity: boolean;
    healthReminders: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
}

export interface Notification {
    _id: string;
    type: 'pantry' | 'grocery' | 'chef' | 'community' | 'health' | 'payment' | 'subscription' | 'system';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    isRead: boolean;
    data?: any;
    createdAt: string;
    readAt?: string;
}

export function useNotifications() {
    const { user } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(false);
    
    const notificationListener = useRef<Notifications.Subscription | null>(null);
    const responseListener = useRef<Notifications.Subscription | null>(null);

    // Register for push notifications
    useEffect(() => {
        if (!user) return;

        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setExpoPushToken(token);
                // Register token with backend
                apiClient.post('/notifications/register-token', { token })
                    .catch(error => console.error('Error registering token:', error));
            }
        });

        // Listener for notifications received while app is foregrounded
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
            // Refresh notifications list
            fetchNotifications();
        });

        // Listener for when user taps on notification
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification tapped:', response);
            const notificationData = response.notification.request.content.data;
            // Handle navigation based on notification type
            handleNotificationTap(notificationData);
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, [user]);

    // Fetch notifications
    const fetchNotifications = async (page = 1, limit = 20) => {
        try {
            console.log('📡 Fetching notifications from API...')
            setLoading(true);
            const response = await apiClient.get(`/notifications?page=${page}&limit=${limit}`);
            console.log('📡 API Response:', response);
            
            if ((response as any).success) {
                console.log('✅ Notifications loaded:', (response as any).notifications?.length || 0);
                setNotifications((response as any).notifications);
                setUnreadCount((response as any).unreadCount);
                
                // Update badge count
                await setBadgeCount((response as any).unreadCount);
            } else {
                console.log('❌ API returned success=false');
            }
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch preferences
    const fetchPreferences = async () => {
        try {
            const response = await apiClient.get('/notifications/preferences');
            if ((response as any).success) {
                setPreferences((response as any).preferences);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
        }
    };

    // Update preferences
    const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
        try {
            const response = await apiClient.put('/notifications/preferences', newPreferences);
            if ((response as any).success) {
                setPreferences((response as any).preferences);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating preferences:', error);
            return false;
        }
    };

    // Mark as read
    const markAsRead = async (notificationIds?: string[], markAll = false) => {
        try {
            const response = await apiClient.put('/notifications/mark-read', {
                notificationIds,
                markAll
            });
            
            if ((response as any).success) {
                // Update local state
                if (markAll) {
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    setUnreadCount(0);
                    await setBadgeCount(0);
                } else if (notificationIds) {
                    setNotifications(prev => 
                        prev.map(n => 
                            notificationIds.includes(n._id) ? { ...n, isRead: true } : n
                        )
                    );
                    setUnreadCount(prev => {
                        const newCount = Math.max(0, prev - notificationIds.length);
                        setBadgeCount(newCount);
                        return newCount;
                    });
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error marking as read:', error);
            return false;
        }
    };

    // Delete notifications
    const deleteNotifications = async (notificationIds?: string[], deleteAll = false) => {
        try {
            const response = await apiClient.request('/notifications', {
                method: 'DELETE',
                body: JSON.stringify({ notificationIds, deleteAll })
            });
            
            if ((response as any).success) {
                if (deleteAll) {
                    setNotifications([]);
                    setUnreadCount(0);
                    await setBadgeCount(0);
                } else if (notificationIds) {
                    setNotifications(prev => 
                        prev.filter(n => !notificationIds.includes(n._id))
                    );
                    setUnreadCount(prev => {
                        const deletedUnreadCount = notifications
                            .filter(n => notificationIds.includes(n._id) && !n.isRead)
                            .length;
                        const newCount = Math.max(0, prev - deletedUnreadCount);
                        setBadgeCount(newCount);
                        return newCount;
                    });
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting notifications:', error);
            return false;
        }
    };

    // Send test notification
    const sendTestNotification = async () => {
        try {
            console.log('🔔 Sending test notification...');
            const response = await apiClient.post('/notifications/test', {});
            console.log('🔔 Test notification response:', response);
            const success = (response as any).success;
            console.log('🔔 Test notification success:', success);
            return success;
        } catch (error) {
            console.error('❌ Error sending test notification:', error);
            return false;
        }
    };

    // Handle notification tap
    const handleNotificationTap = (data: any) => {
        // This should be implemented based on your navigation structure
        console.log('Handle notification tap:', data);
        
        // Mark as read
        if (data.notificationId) {
            markAsRead([data.notificationId]);
        }

        // Navigate based on type
        // You'll need to implement navigation logic here
        // For example:
        // if (data.type === 'pantry') {
        //     navigation.navigate('Pantry', { itemId: data.itemId });
        // }
    };

    // Trigger manual checks
    const checkPantryExpiry = async () => {
        try {
            const response = await apiClient.post('/notifications/check-pantry', {});
            return (response as any).success;
        } catch (error) {
            console.error('Error checking pantry expiry:', error);
            return false;
        }
    };

    const checkGroceryDeadlines = async () => {
        try {
            const response = await apiClient.post('/notifications/check-grocery', {});
            return (response as any).success;
        } catch (error) {
            console.error('Error checking grocery deadlines:', error);
            return false;
        }
    };

    return {
        expoPushToken,
        notifications,
        unreadCount,
        preferences,
        loading,
        fetchNotifications,
        fetchPreferences,
        updatePreferences,
        markAsRead,
        deleteNotifications,
        sendTestNotification,
        checkPantryExpiry,
        checkGroceryDeadlines
    };
}
