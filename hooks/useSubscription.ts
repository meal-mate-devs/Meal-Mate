// hooks/useSubscription.ts
import { useAuthContext } from '@/context/authContext';

/**
 * Hook to check user's subscription status and premium features access
 */
export const useSubscription = () => {
    const { profile } = useAuthContext();

    const isPro = profile?.isPro || false;
    const subscriptionStatus = profile?.subscriptionStatus;
    const subscriptionPlan = profile?.subscriptionPlan;
    const subscriptionEndDate = profile?.subscriptionCurrentPeriodEnd;

    const isActive = subscriptionStatus === 'active';
    const isTrialing = subscriptionStatus === 'trialing';
    const isPastDue = subscriptionStatus === 'past_due';
    const isCanceled = subscriptionStatus === 'canceled';

    const isMonthly = subscriptionPlan === 'monthly';
    const isYearly = subscriptionPlan === 'yearly';

    /**
     * Check if user has access to a premium feature
     */
    const hasPremiumAccess = (): boolean => {
        return isPro && (isActive || isTrialing);
    };

    /**
     * Check if subscription is about to expire (within 7 days)
     */
    const isExpiringSoon = (): boolean => {
        if (!subscriptionEndDate) return false;

        const endDate = new Date(subscriptionEndDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    };

    /**
     * Get days remaining in subscription
     */
    const getDaysRemaining = (): number | null => {
        if (!subscriptionEndDate) return null;

        const endDate = new Date(subscriptionEndDate);
        const now = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return daysRemaining > 0 ? daysRemaining : 0;
    };

    /**
     * Get formatted expiry date
     */
    const getFormattedExpiryDate = (): string | null => {
        if (!subscriptionEndDate) return null;

        return new Date(subscriptionEndDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    /**
     * Get subscription status message
     */
    const getStatusMessage = (): string => {
        if (!isPro) return 'Free Plan';

        switch (subscriptionStatus) {
            case 'active':
                return 'Active Premium';
            case 'trialing':
                return 'Free Trial Active';
            case 'past_due':
                return 'Payment Required';
            case 'canceled':
                return 'Subscription Canceled';
            case 'incomplete':
                return 'Payment Incomplete';
            case 'unpaid':
                return 'Payment Failed';
            default:
                return 'Premium';
        }
    };

    return {
        // Basic status
        isPro,
        subscriptionStatus,
        subscriptionPlan,
        subscriptionEndDate,

        // Status checks
        isActive,
        isTrialing,
        isPastDue,
        isCanceled,
        isMonthly,
        isYearly,

        // Premium access
        hasPremiumAccess,

        // Expiry information
        isExpiringSoon,
        getDaysRemaining,
        getFormattedExpiryDate,

        // Display helpers
        getStatusMessage,
    };
};
