import useAuth from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import {
    registerForPushNotificationsAsync,
    setBadgeCount
} from '@/lib/services/notificationService';
import * as Notifications from 'expo-notifications';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface NotificationContextType {
    expoPushToken: string | null;
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshUnreadCount = async () => {
        try {
            const response = await apiClient.get('/notifications?page=1&limit=1');
            
            if ((response as any).success) {
                const count = (response as any).unreadCount || 0;
                setUnreadCount(count);
                await setBadgeCount(count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        if (!user) return;

        // Register for push notifications
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setExpoPushToken(token);
                // Register token with backend
                apiClient.post('/notifications/register-token', { token })
                    .catch(error => console.error('Error registering token:', error));
            }
        });

        // Fetch initial unread count
        refreshUnreadCount();

        // Listen for new notifications
        const subscription = Notifications.addNotificationReceivedListener(() => {
            refreshUnreadCount();
        });

        return () => {
            subscription.remove();
        };
    }, [user]);

    return (
        <NotificationContext.Provider value={{ expoPushToken, unreadCount, refreshUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return context;
}
