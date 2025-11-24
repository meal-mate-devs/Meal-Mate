import { useAuthContext } from '@/context/authContext';
import { stripeConnectService } from '@/lib/services/stripeConnectService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert, AppState, AppStateStatus, RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import CustomDialog from '../atoms/CustomDialog';

interface MonetizationStats {
    premiumRecipes: {
        count: number;
        totalViews: number;
    };
    premiumCourses: {
        count: number;
        totalViews: number;
    };
    totalEarnings: number;
    withdrawnEarnings: number;
    availableBalance: number;
    activeSubscribers: number;
    lastWithdrawalAmount: number;
    lastWithdrawalAt: string | null;
}

export default function ChefMonetizationScreen() {
    const router = useRouter();
    const { profile } = useAuthContext();
    const [stats, setStats] = useState<MonetizationStats>({
        premiumRecipes: { count: 0, totalViews: 0 },
        premiumCourses: { count: 0, totalViews: 0 },
        totalEarnings: 0,
        withdrawnEarnings: 0,
        availableBalance: 0,
        activeSubscribers: 0,
        lastWithdrawalAmount: 0,
        lastWithdrawalAt: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statsError, setStatsError] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [isStripeLoading, setIsStripeLoading] = useState(false);
    const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
    const [withdrawalDialogContent, setWithdrawalDialogContent] = useState<{
        title: string;
        content: React.ReactNode;
        onConfirm?: () => void;
        onCancel?: () => void;
        confirmText?: string;
        cancelText?: string;
    }>({
        title: '',
        content: null
    });
    const [stripeStatus, setStripeStatus] = useState<{
        hasAccount: boolean;
        onboardingComplete: boolean;
        payoutsEnabled: boolean;
        chargesEnabled: boolean;
        detailsSubmitted: boolean;
        statusMessage: string;
        statusType: 'success' | 'warning' | 'error' | 'pending' | '';
        pendingRequirements: string[];
        errors: Array<{ code: string; message: string }>;
    }>({
        hasAccount: false,
        onboardingComplete: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        detailsSubmitted: false,
        statusMessage: '',
        statusType: '',
        pendingRequirements: [],
        errors: []
    });

    const MINIMUM_WITHDRAWAL = 5;

    // Helper function to show dialogs
    const showDialog = (
        title: string,
        content: React.ReactNode,
        onConfirm?: () => void,
        onCancel?: () => void,
        confirmText?: string,
        cancelText?: string
    ) => {
        setWithdrawalDialogContent({
            title,
            content,
            onConfirm,
            onCancel,
            confirmText,
            cancelText
        });
        setShowWithdrawalDialog(true);
    };

    // Handle Stripe onboarding or dashboard access
    const handleStripeAction = async () => {
        setIsStripeLoading(true);
        try {
            const { Linking } = await import('react-native');
            
            if (!stripeStatus.onboardingComplete) {
                // Start or continue onboarding
                console.log('🔗 [STRIPE] Starting onboarding...');
                const response = await stripeConnectService.createAccountLink();
                
                if (response.success && response.url) {
                    const canOpen = await Linking.canOpenURL(response.url);
                    if (canOpen) {
                        await Linking.openURL(response.url);
                        console.log('✅ Opened Stripe onboarding URL');
                    } else {
                        Alert.alert('Error', 'Unable to open Stripe onboarding. Please try again.');
                    }
                } else {
                    Alert.alert('Error', 'Failed to create onboarding link. Please try again.');
                }
            } else {
                // Open Stripe Express Dashboard
                console.log('🔗 [STRIPE] Opening dashboard...');
                const dashboardResponse = await stripeConnectService.getDashboardLink();
                
                if (dashboardResponse.success && dashboardResponse.url) {
                    const canOpen = await Linking.canOpenURL(dashboardResponse.url);
                    if (canOpen) {
                        await Linking.openURL(dashboardResponse.url);
                        console.log('✅ Opened Stripe Express Dashboard');
                    } else {
                        Alert.alert('Error', 'Unable to open Stripe dashboard. Please try again.');
                    }
                } else {
                    Alert.alert('Error', 'Failed to get dashboard link. Please try again.');
                }
            }
        } catch (error: any) {
            console.log('❌ [STRIPE] Error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setIsStripeLoading(false);
            // Refresh Stripe status after action
            fetchStripeStatus();
        }
    };

    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchMonetizationStats = async () => {
        try {
            if (!profile?.firebaseUid) {
                console.log('⚠️ [FRONTEND] No firebaseUid available');
                setIsLoading(false); // Set loading to false even if no user
                return;
            }

            console.log('📡 [FRONTEND] Fetching monetization stats for user:', profile.firebaseUid);

            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            const response = await fetch(`${API_BASE_URL}/chef/monetization-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': profile.firebaseUid
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId); // Clear timeout if request completes

            console.log('📡 [FRONTEND] API response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('📊 [FRONTEND] Received monetization data:', data);

                setStats({
                    premiumRecipes: data.stats.premiumRecipes || { count: 0, totalViews: 0 },
                    premiumCourses: data.stats.premiumCourses || { count: 0, totalViews: 0 },
                    totalEarnings: data.stats.totalEarnings || 0,
                    withdrawnEarnings: data.stats.withdrawnEarnings || 0,
                    availableBalance: data.stats.availableBalance || 0,
                    activeSubscribers: data.stats.activeSubscribers || 0,
                    lastWithdrawalAmount: data.stats.lastWithdrawalAmount || 0,
                    lastWithdrawalAt: data.stats.lastWithdrawalAt || null
                });

                console.log('💰 [FRONTEND] Updated stats state:', {
                    totalEarnings: data.stats.totalEarnings || 0,
                    availableBalance: data.stats.availableBalance || 0,
                    activeSubscribers: data.stats.activeSubscribers || 0
                });
                setStatsError(false); // Reset error state on successful data fetch
            } else {
                const errorData = await response.json();
                console.log('❌ [FRONTEND] API error:', errorData);
                setStatsError(true);
            }
        } catch (error) {
            console.log('❌ [FRONTEND] Error fetching monetization stats:', error);
            setStatsError(true);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch Stripe account status
    const fetchStripeStatus = async () => {
        try {
            console.log('🔍 [FRONTEND] Checking Stripe account status...');
            const statusResponse = await stripeConnectService.checkAccountStatus();
            console.log('🔍 [FRONTEND] Stripe status response:', JSON.stringify(statusResponse, null, 2));
            
            setStripeStatus({
                hasAccount: statusResponse.hasAccount || !!statusResponse.accountId,
                onboardingComplete: statusResponse.onboardingComplete,
                payoutsEnabled: statusResponse.payoutsEnabled,
                chargesEnabled: statusResponse.chargesEnabled,
                detailsSubmitted: statusResponse.detailsSubmitted,
                statusMessage: statusResponse.statusMessage || '',
                statusType: statusResponse.statusType || '',
                pendingRequirements: statusResponse.pendingRequirements || [],
                errors: statusResponse.errors || []
            });

            // If stats are included in the Stripe response, update the stats state
            if (statusResponse.stats) {
                console.log('📊 [FRONTEND] Using stats from Stripe response:', statusResponse.stats);
                setStats({
                    premiumRecipes: statusResponse.stats.premiumRecipes || { count: 0, totalViews: 0 },
                    premiumCourses: statusResponse.stats.premiumCourses || { count: 0, totalViews: 0 },
                    totalEarnings: statusResponse.stats.totalEarnings || 0,
                    withdrawnEarnings: statusResponse.stats.withdrawnEarnings || 0,
                    availableBalance: statusResponse.stats.availableBalance || 0,
                    activeSubscribers: statusResponse.stats.activeSubscribers || 0,
                    lastWithdrawalAmount: statusResponse.stats.lastWithdrawalAmount || 0,
                    lastWithdrawalAt: statusResponse.stats.lastWithdrawalAt || null
                });
                // Don't set loading to false here since we might still be fetching monetization stats
            }

            console.log('✅ [FRONTEND] Updated stripeStatus state:', {
                hasAccount: statusResponse.hasAccount || !!statusResponse.accountId,
                onboardingComplete: statusResponse.onboardingComplete,
                payoutsEnabled: statusResponse.payoutsEnabled,
                statusType: statusResponse.statusType
            });
        } catch (error) {
            console.log('❌ [FRONTEND] Error fetching Stripe status:', error);
        } finally {
            setRefreshing(false); // Always set refreshing to false
        }
    };

    // Handle withdrawal
    const handleWithdraw = async () => {
        console.log('💸 [FRONTEND] Withdraw button pressed');

        // Parse the withdrawal amount
        const amount = parseFloat(withdrawalAmount);
        
        // Check if amount is valid
        if (!withdrawalAmount || isNaN(amount) || amount <= 0) {
            showDialog('Invalid Amount', <Text>Please enter a valid withdrawal amount.</Text>, undefined, undefined, 'OK');
            return;
        }

        // Check if user has enough balance
        if (amount > stats.availableBalance) {
            showDialog(
                'Insufficient Balance',
                <Text>You cannot withdraw more than your available balance of ${stats.availableBalance.toFixed(2)}.</Text>,
                undefined,
                undefined,
                'OK'
            );
            return;
        }

        // Check minimum withdrawal
        if (amount < MINIMUM_WITHDRAWAL) {
            showDialog(
                'Below Minimum',
                <Text>Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL}.</Text>,
                undefined,
                undefined,
                'OK'
            );
            return;
        }

        // Check Stripe account status
        if (!stripeStatus.hasAccount || !stripeStatus.payoutsEnabled) {
            showDialog(
                'Setup Required',
                <Text>Please complete your Stripe account setup from the Chef Dashboard before you can withdraw funds.</Text>,
                () => router.back(),
                undefined,
                'Go to Dashboard',
                'Cancel'
            );
            return;
        }

        // Confirm withdrawal
        showDialog(
            'Confirm Withdrawal',
            <Text>You are about to withdraw ${amount.toFixed(2)} to your connected Stripe account.{'\n\n'}This action cannot be undone.</Text>,
            async () => {
                setIsWithdrawing(true);
                try {
                    console.log('💸 [FRONTEND] Processing withdrawal...');
                    const response = await stripeConnectService.withdrawEarnings(amount);

                    if (response.success) {
                        // Clear the input field
                        setWithdrawalAmount('');
                        
                        showDialog(
                            'Withdrawal Successful! 🎉',
                            <Text>${response.withdrawalAmount?.toFixed(2)} has been transferred to your Stripe account.{'\n\n'}Transfer ID: ${response.transferId}</Text>,
                            () => fetchStripeStatus(),
                            undefined,
                            'Great!'
                        );
                    } else {
                        // Handle specific error codes
                        let errorMessage = response.error || 'Failed to process withdrawal.';
                        
                        if (response.code === 'PAYOUTS_NOT_ENABLED') {
                            errorMessage = 'Your Stripe account is not fully set up for payouts. Please complete onboarding from the Chef Dashboard.';
                        } else if (response.code === 'PLATFORM_BALANCE_INSUFFICIENT') {
                            errorMessage = 'Platform balance is temporarily insufficient. Please try again later or contact support.';
                        } else if (response.code === 'BELOW_MINIMUM') {
                            errorMessage = `Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL}.`;
                        }

                        showDialog('Withdrawal Failed', <Text>{errorMessage}</Text>, undefined, undefined, 'OK');
                    }
                } catch (error: any) {
                    console.log('❌ [FRONTEND] Withdrawal error:', error);
                    showDialog(
                        'Error',
                        <Text>An unexpected error occurred. Please try again later.</Text>,
                        undefined,
                        undefined,
                        'OK'
                    );
                } finally {
                    setIsWithdrawing(false);
                }
            },
            undefined,
            'Withdraw',
            'Cancel'
        );
    };

    useEffect(() => {
        console.log('📱 [FRONTEND] ChefMonetizationScreen mounted - fetching initial stats');

        fetchStripeStatus(); // Fetching Stripe account status
        fetchMonetizationStats(); // Fetch monetization stats separately

        return () => {
        };
    }, [profile]);

    // Refresh Stripe status when screen gains focus (e.g., returning from Stripe onboarding)
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 [FRONTEND] Screen focused - refreshing Stripe status');
            fetchStripeStatus();
        }, [])
    );

    // Also refresh when app comes back to foreground
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                console.log('🔄 [FRONTEND] App became active - refreshing Stripe status');
                fetchStripeStatus();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const onRefresh = () => {
        console.log('🔄 [FRONTEND] Refresh button pressed - triggering earnings calculation');
        setStatsError(false); // Reset stats error on manual refresh
        setRefreshing(true);
        fetchStripeStatus(); // Refresh Stripe status
        fetchMonetizationStats(); // Refresh monetization stats
    };

    const renderStatCard = (
        title: string,
        count: number,
        views: number,
        icon: string,
        gradientColors: [string, string]
    ) => (
        <View style={styles.statCard}>
            <LinearGradient
                colors={gradientColors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
            >
                <View style={styles.statHeader}>
                    <Ionicons name={icon as any} size={32} color="#FACC15" />
                    <Text style={styles.statTitle}>{title}</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{count}</Text>
                        <Text style={styles.statLabel}>Premium Items</Text>
                    </View>

                    <View style={styles.statDivider} />

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{views.toLocaleString()}</Text>
                        <Text style={styles.statLabel}>Total Views</Text>
                    </View>
                </View>

                <View style={styles.statFooter}>
                    <Ionicons name="eye-outline" size={16} color="#94A3B8" />
                    <Text style={styles.statFooterText}>
                        {count > 0 ? `Avg: ${Math.round(views / count)} views per item` : 'No data yet'}
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );

    const renderEarningsCard = () => (
        <View style={styles.statCard}>
            <LinearGradient
                colors={['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)'] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statGradient}
            >
                <View style={styles.statHeader}>
                    <Ionicons name="cash-outline" size={32} color="#FACC15" />
                    <Text style={styles.statTitle}>Earnings Dashboard</Text>
                </View>

                <View style={styles.earningsContainer}>
                    <Text style={styles.earningsAmount}>${stats.availableBalance.toFixed(2)}</Text>
                    <Text style={styles.earningsLabel}>Available Balance</Text>
                </View>

                <View style={styles.earningsBreakdown}>
                    <View style={styles.earningsRow}>
                        <Text style={styles.earningsBreakdownLabel}>Total Earned:</Text>
                        <Text style={styles.earningsBreakdownValue}>${stats.totalEarnings.toFixed(2)}</Text>
                    </View>
                    <View style={styles.earningsRow}>
                        <Text style={styles.earningsBreakdownLabel}>Withdrawn:</Text>
                        <Text style={styles.earningsBreakdownValue}>${stats.withdrawnEarnings.toFixed(2)}</Text>
                    </View>
                    <View style={styles.earningsRow}>
                        <Text style={styles.earningsBreakdownLabel}>Active Subscribers:</Text>
                        <Text style={styles.earningsBreakdownValue}>{stats.activeSubscribers}</Text>
                    </View>
                    {stats.lastWithdrawalAt && (
                        <View style={styles.lastWithdrawalSection}>
                            <View style={styles.earningsRow}>
                                <Text style={styles.earningsBreakdownLabel}>Last Withdrawal:</Text>
                                <Text style={styles.earningsBreakdownValue}>${stats.lastWithdrawalAmount.toFixed(2)}</Text>
                            </View>
                            <Text style={styles.lastWithdrawalDate}>
                                {new Date(stats.lastWithdrawalAt).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Withdrawal Amount Input */}
                {stats.availableBalance >= MINIMUM_WITHDRAWAL && (
                    <View style={styles.withdrawalInputContainer}>
                        <Text style={styles.withdrawalInputLabel}>Withdrawal Amount ($)</Text>
                        <TextInput
                            style={styles.withdrawalInput}
                            value={withdrawalAmount}
                            onChangeText={(text: string) => {
                                // Only allow numbers and decimal point
                                const cleanedText = text.replace(/[^0-9.]/g, '');
                                // Ensure only one decimal point
                                const parts = cleanedText.split('.');
                                const formattedText = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleanedText;
                                setWithdrawalAmount(formattedText);
                            }}
                            placeholder={`Min. $${MINIMUM_WITHDRAWAL} - Max. $${stats.availableBalance.toFixed(2)}`}
                            placeholderTextColor="#64748B"
                            keyboardType="decimal-pad"
                            maxLength={10}
                        />
                        {withdrawalAmount && (
                            <Text style={styles.withdrawalAmountHint}>
                                You'll receive: ${(parseFloat(withdrawalAmount) || 0).toFixed(2)}
                            </Text>
                        )}
                    </View>
                )}

                {/* Action Buttons Row */}
                <View style={styles.earningsButtonsRow}>
                    {/* Withdraw Button */}
                    <TouchableOpacity 
                        style={[
                            styles.withdrawButton,
                            styles.earningsButtonFlex,
                            (!withdrawalAmount || parseFloat(withdrawalAmount) < MINIMUM_WITHDRAWAL || parseFloat(withdrawalAmount) > stats.availableBalance || isWithdrawing) && styles.withdrawButtonDisabled
                        ]}
                        onPress={handleWithdraw}
                        disabled={!withdrawalAmount || parseFloat(withdrawalAmount) < MINIMUM_WITHDRAWAL || parseFloat(withdrawalAmount) > stats.availableBalance || isWithdrawing}
                    >
                        {isWithdrawing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.withdrawButtonText}>
                                    {!withdrawalAmount 
                                        ? 'Enter Amount' 
                                        : parseFloat(withdrawalAmount) < MINIMUM_WITHDRAWAL
                                        ? `Min. $${MINIMUM_WITHDRAWAL}`
                                        : parseFloat(withdrawalAmount) > stats.availableBalance
                                        ? 'Too High'
                                        : 'Withdraw'
                                    }
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Stripe Dashboard/Onboarding Button */}
                    <TouchableOpacity 
                        style={[
                            styles.stripeButton,
                            styles.earningsButtonFlex,
                            isStripeLoading && styles.stripeButtonLoading
                        ]}
                        onPress={handleStripeAction}
                        disabled={isStripeLoading}
                    >
                        {isStripeLoading ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                                <Text style={styles.stripeButtonText}>
                                    {stripeStatus.onboardingComplete ? 'Stripe Dashboard' : 'Setup Stripe'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Stripe Status Card */}
                {renderStripeStatusCard()}
            </LinearGradient>

            {/* Withdrawal Dialog */}
            <CustomDialog
                visible={showWithdrawalDialog}
                onClose={() => {
                    setShowWithdrawalDialog(false);
                    withdrawalDialogContent.onCancel?.();
                }}
                title={withdrawalDialogContent.title}
            >
                <View style={{ padding: 20 }}>
                    {withdrawalDialogContent.content}
                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
                        {withdrawalDialogContent.cancelText && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowWithdrawalDialog(false);
                                    withdrawalDialogContent.onCancel?.();
                                }}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 6,
                                    borderWidth: 1,
                                    borderColor: '#64748B'
                                }}
                            >
                                <Text style={{ color: '#64748B', fontWeight: '500' }}>
                                    {withdrawalDialogContent.cancelText}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {withdrawalDialogContent.confirmText && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowWithdrawalDialog(false);
                                    withdrawalDialogContent.onConfirm?.();
                                }}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 6,
                                    backgroundColor: '#FACC15'
                                }}
                            >
                                <Text style={{ color: '#0F172A', fontWeight: '600' }}>
                                    {withdrawalDialogContent.confirmText}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </CustomDialog>
        </View>
    );

    // Render detailed Stripe status card
    function renderStripeStatusCard() {
        // If fully complete, show success
        if (stripeStatus.onboardingComplete) {
            return (
                <View style={[styles.stripeStatusCard, styles.stripeStatusSuccess]}>
                    <View style={styles.stripeStatusHeader}>
                        <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
                        <Text style={[styles.stripeStatusTitle, { color: '#22C55E' }]}>
                            Account Ready
                        </Text>
                    </View>
                    <Text style={styles.stripeStatusMessage}>
                        Your Stripe account is fully set up. You can withdraw your earnings by navigating to Stripe Dashboard!
                    </Text>
                </View>
            );
        }

        // If no account yet
        if (!stripeStatus.hasAccount) {
            return (
                <View style={[styles.stripeStatusCard, styles.stripeStatusWarning]}>
                    <View style={styles.stripeStatusHeader}>
                        <Ionicons name="information-circle" size={18} color="#F59E0B" />
                        <Text style={[styles.stripeStatusTitle, { color: '#F59E0B' }]}>
                            Setup Required
                        </Text>
                    </View>
                    <Text style={styles.stripeStatusMessage}>
                        Complete your Stripe account setup to start receiving payouts for your premium content.
                    </Text>
                </View>
            );
        }

        // If there are errors (like verification failed)
        if (stripeStatus.errors && stripeStatus.errors.length > 0) {
            return (
                <View style={[styles.stripeStatusCard, styles.stripeStatusError]}>
                    <View style={styles.stripeStatusHeader}>
                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                        <Text style={[styles.stripeStatusTitle, { color: '#EF4444' }]}>
                            Action Required
                        </Text>
                    </View>
                    <Text style={styles.stripeStatusMessage}>
                        {stripeStatus.statusMessage || 'Please complete the pending requirements.'}
                    </Text>
                    {stripeStatus.pendingRequirements.length > 0 && (
                        <View style={styles.requirementsList}>
                            {stripeStatus.pendingRequirements.map((req, index) => (
                                <View key={index} style={styles.requirementItem}>
                                    <Ionicons name="ellipse" size={6} color="#EF4444" />
                                    <Text style={styles.requirementText}>{req}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    <Text style={styles.stripeStatusHint}>
                        Tap "Setup Stripe" to complete the verification process.
                    </Text>
                </View>
            );
        }

        // If details submitted but pending verification
        if (stripeStatus.detailsSubmitted && !stripeStatus.payoutsEnabled) {
            return (
                <View style={[styles.stripeStatusCard, styles.stripeStatusPending]}>
                    <View style={styles.stripeStatusHeader}>
                        <ActivityIndicator size={16} color="#3B82F6" />
                        <Text style={[styles.stripeStatusTitle, { color: '#3B82F6' }]}>
                            Verification Pending
                        </Text>
                    </View>
                    <Text style={styles.stripeStatusMessage}>
                        {stripeStatus.statusMessage || 'Stripe is reviewing your information. This usually takes a few minutes.'}
                    </Text>
                    {stripeStatus.pendingRequirements.length > 0 && (
                        <View style={styles.requirementsList}>
                            <Text style={styles.requirementsLabel}>Pending items:</Text>
                            {stripeStatus.pendingRequirements.map((req, index) => (
                                <View key={index} style={styles.requirementItem}>
                                    <Ionicons name="time-outline" size={12} color="#3B82F6" />
                                    <Text style={styles.requirementText}>{req}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            );
        }

        // Default: needs setup
        return (
            <View style={[styles.stripeStatusCard, styles.stripeStatusWarning]}>
                <View style={styles.stripeStatusHeader}>
                    <Ionicons name="warning-outline" size={18} color="#F59E0B" />
                    <Text style={[styles.stripeStatusTitle, { color: '#F59E0B' }]}>
                        Setup Incomplete
                    </Text>
                </View>
                <Text style={styles.stripeStatusMessage}>
                    {stripeStatus.statusMessage || 'Complete your Stripe account setup to receive payouts.'}
                </Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    style={styles.gradient}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Monetization</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#FACC15" />
                        <Text style={styles.loadingText}>Loading stats...</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    // Show error screen if stats failed to load
    if (statsError) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={['#0F172A', '#1E293B']}
                    style={styles.gradient}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Monetization</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <View style={styles.loadingContainer}>
                        <Ionicons name="alert-circle" size={48} color="#EF4444" />
                        <Text style={styles.loadingText}>Failed to load monetization data</Text>
                        <Text style={styles.errorSubtext}>Unable to connect to the server. Please check your connection and try again.</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setStatsError(false);
                                setIsLoading(true);
                                fetchStripeStatus();
                                fetchMonetizationStats();
                            }}
                            style={styles.retryButton}
                        >
                            <Ionicons name="refresh" size={16} color="#FFFFFF" />
                            <Text style={styles.retryButtonText}>Reload</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F172A', '#1E293B']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Monetization</Text>
                    <TouchableOpacity
                        onPress={onRefresh}
                        style={styles.refreshButton}
                    >
                        <Ionicons name="refresh" size={24} color="#F1F5F9" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FACC15"
                        />
                    }
                >
                    {/* Earnings Dashboard Card - Moved to Top */}
                    {renderEarningsCard()}

                    {/* Premium Content Overview - Simplified heading */}
                    <Text style={styles.overviewTitle}>Premium Content Overview</Text>

                    {/* Premium Recipes Stats */}
                    {renderStatCard(
                        'Premium Recipes',
                        stats.premiumRecipes.count,
                        stats.premiumRecipes.totalViews,
                        'restaurant',
                        ['rgba(34, 197, 94, 0.15)', 'rgba(34, 197, 94, 0.05)']
                    )}

                    {/* Premium Courses Stats */}
                    {renderStatCard(
                        'Premium Courses',
                        stats.premiumCourses.count,
                        stats.premiumCourses.totalViews,
                        'school',
                        ['rgba(246, 196, 59, 0.15)', 'rgba(246, 196, 59, 0.05)']
                    )}

                    {/* Earnings Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="cash-outline" size={20} color="#8B5CF6" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>How Earnings Work</Text>
                            <Text style={styles.infoText}>
                                We reserve 70% of subscription revenue for premium creators. Your share is based 
                                on your premium content views: Earnings = Pool × (Your Views / Total Platform Views).
                            </Text>
                        </View>
                    </View>

                    {/* Bottom Spacing */}
                    <View style={{ height: 16 }} />
                </ScrollView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A'
    },
    gradient: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)'
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F1F5F9',
        letterSpacing: 0.5
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    placeholder: {
        width: 40
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16
    },
    loadingText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '500'
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20
    },
    overviewTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#F1F5F9',
        marginTop: 14,
        marginBottom: 8,
        letterSpacing: 0.5
    },
    statCard: {
        marginTop: 12,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)'
    },
    statGradient: {
        padding: 12
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12
    },
    statTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F1F5F9'
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 12,
        padding: 12
    },
    statItem: {
        alignItems: 'center',
        flex: 1
    },
    statDivider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FACC15',
        marginBottom: 2
    },
    statLabel: {
        fontSize: 10,
        color: '#94A3B8',
        textAlign: 'center'
    },
    statFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)'
    },
    statFooterText: {
        fontSize: 11,
        color: '#94A3B8'
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: 'rgba(96, 165, 250, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(96, 165, 250, 0.2)'
    },
    infoTextContainer: {
        flex: 1
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#F1F5F9',
        marginBottom: 2
    },
    infoText: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 16
    },
    earningsContainer: {
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 12
    },
    earningsAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FACC15',
        marginBottom: 4
    },
    earningsLabel: {
        fontSize: 12,
        color: '#94A3B8'
    },
    earningsBreakdown: {
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
        marginBottom: 12,
        gap: 6
    },
    earningsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    earningsBreakdownLabel: {
        fontSize: 12,
        color: '#94A3B8'
    },
    earningsBreakdownValue: {
        fontSize: 12,
        fontWeight: '600',
        color: '#F1F5F9'
    },
    lastWithdrawalSection: {
        marginTop: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)'
    },
    lastWithdrawalDate: {
        fontSize: 10,
        color: '#64748B',
        marginTop: 2,
        textAlign: 'right'
    },
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#8B5CF6',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginTop: 8
    },
    withdrawButtonDisabled: {
        backgroundColor: '#4B5563',
        opacity: 0.7
    },
    withdrawButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF'
    },
    withdrawalInputContainer: {
        marginTop: 12,
        marginBottom: 8
    },
    withdrawalInputLabel: {
        fontSize: 12,
        fontWeight: '500',
        color: '#F1F5F9',
        marginBottom: 6
    },
    withdrawalInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#F1F5F9',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    withdrawalAmountHint: {
        fontSize: 11,
        color: '#94A3B8',
        marginTop: 4,
        textAlign: 'right'
    },
    earningsButtonsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8
    },
    earningsButtonFlex: {
        flex: 1,
        marginTop: 0
    },
    stripeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: '#6366F1',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12
    },
    stripeButtonLoading: {
        opacity: 0.7
    },
    stripeButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF'
    },
    stripeWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)'
    },
    stripeWarningText: {
        fontSize: 11,
        color: '#F59E0B',
        flex: 1
    },
    // Stripe Status Card Styles
    stripeStatusCard: {
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1
    },
    stripeStatusSuccess: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.3)'
    },
    stripeStatusWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)'
    },
    stripeStatusError: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    stripeStatusPending: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)'
    },
    stripeStatusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6
    },
    stripeStatusTitle: {
        fontSize: 13,
        fontWeight: '600'
    },
    stripeStatusMessage: {
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18
    },
    stripeStatusHint: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 8,
        fontStyle: 'italic'
    },
    requirementsList: {
        marginTop: 8,
        gap: 4
    },
    requirementsLabel: {
        fontSize: 11,
        color: '#64748B',
        marginBottom: 4
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingLeft: 4
    },
    requirementText: {
        fontSize: 11,
        color: '#CBD5E1',
        flex: 1
    },
    errorSubtext: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FACC15',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8
    },
    retryButtonText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '600'
    }
});
