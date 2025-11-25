// lib/types/subscription.ts

export type PlanType = 'monthly' | 'yearly';

export type SubscriptionStatus =
    | 'active'
    | 'canceled'
    | 'past_due'
    | 'unpaid'
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing';

export interface SubscriptionPlan {
    id: PlanType;
    priceId: string;
    name: string;
    amount: number;
    currency: string;
    interval: 'month' | 'year';
    features?: string[];
}

export interface Subscription {
    id: string;
    status: SubscriptionStatus;
    planType: PlanType;
    currentPeriodEnd: Date | string;
    currentPeriodStart: Date | string;
    cancelAtPeriodEnd: boolean;
    canceledAt: Date | string | null;
    amount: number;
    currency: string;
}

export interface PaymentSheetResponse {
    success: boolean;
    subscriptionId: string;
    clientSecret: string;
    customerId?: string;
    ephemeralKey?: string;
    plan: {
        type: PlanType;
        name: string;
        amount: number;
        interval: string;
    };
}

export interface SubscriptionResponse {
    success: boolean;
    isPro: boolean;
    subscription: Subscription | null;
}

export interface PlansResponse {
    success: boolean;
    plans: SubscriptionPlan[];
}

export interface CancelSubscriptionResponse {
    success: boolean;
    subscription: {
        id: string;
        status: string;
        cancelAtPeriodEnd: boolean;
        currentPeriodEnd: Date | string;
    };
}
