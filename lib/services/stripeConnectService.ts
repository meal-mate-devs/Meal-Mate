// lib/services/stripeConnectService.ts

import { apiClient } from '../api/client';

export interface AccountLinkResponse {
    success: boolean;
    url: string;
    accountId: string;
}

export interface AccountStatusResponse {
    success: boolean;
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    accountId?: string;
}

export interface DashboardLinkResponse {
    success: boolean;
    url: string;
}

class StripeConnectService {
    /**
     * Create an account link for chef onboarding
     * @param chefId Optional chef ID, if not provided uses current user's chef profile
     */
    async createAccountLink(chefId?: string): Promise<AccountLinkResponse> {
        try {
            const body = chefId ? { chefId } : {};
            const response = await apiClient.post<AccountLinkResponse>(
                '/stripe/connect/account-link',
                body,
                true // Requires authentication
            );
            console.log('✅ Created account link:', response);
            return response;
        } catch (error) {
            console.log('❌ Failed to create account link:', error);
            throw error;
        }
    }

    /**
     * Check the status of the chef's connected account
     */
    async checkAccountStatus(): Promise<AccountStatusResponse> {
        try {
            const response = await apiClient.get<AccountStatusResponse>(
                '/stripe/connect/account-status',
                true // Requires authentication
            );
            console.log('✅ Account status:', response);
            return response;
        } catch (error) {
            console.log('❌ Failed to check account status:', error);
            throw error;
        }
    }

    /**
     * Get a login link to the Stripe Express Dashboard
     */
    async getDashboardLink(): Promise<DashboardLinkResponse> {
        try {
            const response = await apiClient.get<DashboardLinkResponse>(
                '/stripe/connect/dashboard-link',
                true // Requires authentication
            );
            console.log('✅ Dashboard link:', response);
            return response;
        } catch (error) {
            console.log('❌ Failed to get dashboard link:', error);
            throw error;
        }
    }

    /**
     * Check if chef has completed Stripe onboarding
     */
    async isOnboardingComplete(): Promise<boolean> {
        try {
            const status = await this.checkAccountStatus();
            return status.onboardingComplete;
        } catch (error) {
            console.log('❌ Failed to check onboarding status:', error);
            return false;
        }
    }
}

export const stripeConnectService = new StripeConnectService();
