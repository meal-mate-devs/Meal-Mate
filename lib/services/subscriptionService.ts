// lib/services/subscriptionService.ts

import { apiClient } from '../api/client';
import type {
    CancelSubscriptionResponse,
    PaymentSheetResponse,
    PlansResponse,
    PlanType,
    SubscriptionResponse,
} from '../types/subscription';

class SubscriptionService {

    async getPlans(): Promise<PlansResponse> {
        try {
            const response = await apiClient.get<PlansResponse>(
                '/stripe/plans',
                false // Public endpoint, no auth required
            );
            console.log('Fetched subscription plans:', response);
            return response;
        } catch (error) {
            console.log('Failed to fetch subscription plans:', error);
            throw error;
        }
    }

    async createSubscription(planType: PlanType, paymentMethodId?: string): Promise<PaymentSheetResponse> {
        try {
            const response = await apiClient.post<PaymentSheetResponse>(
                '/stripe/create-subscription',
                { planType, paymentMethodId },
                true // Requires authentication
            );
            return response;
        } catch (error) {
            console.log('Failed to create subscription:', error);
            throw error;
        }
    }
    async getCurrentSubscription(): Promise<SubscriptionResponse> {
        try {
            const response = await apiClient.get<SubscriptionResponse>(
                '/stripe/subscription',
                true // Requires authentication
            );
            return response;
        } catch (error) {
            console.log('Failed to fetch current subscription:', error);
            throw error;
        }
    }

    async cancelSubscription(subscriptionId: string): Promise<CancelSubscriptionResponse> {
        try {
            const response = await apiClient.delete<CancelSubscriptionResponse>(
                `/stripe/cancel-subscription/${subscriptionId}`,
                true // Requires authentication
            );
            return response;
        } catch (error) {
            console.log('Failed to cancel subscription:', error);
            throw error;
        }
    }
    async isPremiumUser(): Promise<boolean> {
        try {
            const response = await this.getCurrentSubscription();
            return response.isPro;
        } catch (error) {
            console.log('Failed to check premium status:', error);
            return false;
        }
    }
    async getSubscriptionExpiryDate(): Promise<Date | null> {
        try {
            const response = await this.getCurrentSubscription();
            if (response.subscription && response.subscription.currentPeriodEnd) {
                return new Date(response.subscription.currentPeriodEnd);
            }
            return null;
        } catch (error) {
            console.log('Failed to get subscription expiry:', error);
            return null;
        }
    }
}

export const subscriptionService = new SubscriptionService();
