// lib/services/stripeConnectService.ts

import { apiClient } from '../api/client';

export interface AccountLinkResponse {
    success: boolean;
    url: string;
    accountId: string;
}

export interface AccountStatusResponse {
    success: boolean;
    hasAccount?: boolean;
    onboardingComplete: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
    detailsSubmitted: boolean;
    accountId?: string;
    // Detailed status info
    statusMessage?: string;
    statusType?: 'success' | 'warning' | 'error' | 'pending';
    pendingRequirements?: string[];
    errors?: Array<{ code: string; message: string }>;
    disabledReason?: string | null;
    capabilities?: {
        cardPayments: string;
        transfers: string;
    };
    // Monetization stats
    stats?: {
        totalEarnings: number;
        withdrawnEarnings: number;
        availableBalance: number;
        activeSubscribers: number;
        premiumRecipes: { count: number; totalViews: number };
        premiumCourses: { count: number; totalViews: number };
        lastCalculated: string;
        lastWithdrawalAmount: number;
        lastWithdrawalAt: string | null;
    };
}

export interface DashboardLinkResponse {
    success: boolean;
    url: string;
}

export interface WithdrawalResponse {
    success: boolean;
    message?: string;
    transferId?: string;
    withdrawalAmount?: number;
    newAvailableBalance?: number;
    withdrawnEarnings?: number;
    lastWithdrawalAt?: string;
    error?: string;
    code?: string;
}

export interface WithdrawalInfoResponse {
    success: boolean;
    earnings: {
        totalEarnings: number;
        withdrawnEarnings: number;
        availableBalance: number;
        lastWithdrawalAmount: number;
        lastWithdrawalAt: string | null;
        lastCalculatedAt: string | null;
    };
    stripe: {
        hasAccount: boolean;
        onboardingComplete: boolean;
        payoutsEnabled: boolean;
        chargesEnabled?: boolean;
    };
    minimumWithdrawal: number;
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

    /**
     * Withdraw chef earnings to connected Stripe account
     * @param amount Optional specific amount to withdraw. If not provided, withdraws all available balance.
     */
    async withdrawEarnings(amount?: number): Promise<WithdrawalResponse> {
        try {
            const body = amount !== undefined ? { amount } : {};
            const response = await apiClient.post<WithdrawalResponse>(
                '/stripe/connect/withdraw',
                body,
                true // Requires authentication
            );
            console.log('✅ Withdrawal successful:', response);
            return response;
        } catch (error: any) {
            console.log('❌ Failed to withdraw earnings:', error);
            // Return error response instead of throwing
            return {
                success: false,
                error: error?.message || 'Failed to process withdrawal',
                code: error?.code || 'UNKNOWN_ERROR'
            };
        }
    }

    /**
     * Get chef's withdrawal info including balance and Stripe status
     */
    async getWithdrawalInfo(): Promise<WithdrawalInfoResponse> {
        try {
            const response = await apiClient.get<WithdrawalInfoResponse>(
                '/stripe/connect/withdrawal-info',
                true // Requires authentication
            );
            console.log('✅ Withdrawal info:', response);
            return response;
        } catch (error) {
            console.log('❌ Failed to get withdrawal info:', error);
            throw error;
        }
    }
}

export const stripeConnectService = new StripeConnectService();
