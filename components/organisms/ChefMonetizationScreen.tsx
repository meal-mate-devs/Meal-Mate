import { useAuthContext } from '@/context/authContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

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

    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchMonetizationStats = async () => {
        try {
            if (!profile?.firebaseUid) {
                console.log('⚠️ [FRONTEND] No firebaseUid available');
                return;
            }

            console.log('📡 [FRONTEND] Fetching monetization stats for user:', profile.firebaseUid);

            const response = await fetch(`${API_BASE_URL}/chef/monetization-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': profile.firebaseUid
                }
            });

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
            } else {
                const errorData = await response.json();
                console.error('❌ [FRONTEND] API error:', errorData);
            }
        } catch (error) {
            console.error('❌ [FRONTEND] Error fetching monetization stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        console.log('📱 [FRONTEND] ChefMonetizationScreen mounted - fetching initial stats');
        fetchMonetizationStats();
    }, [profile]);

    const onRefresh = () => {
        console.log('🔄 [FRONTEND] Refresh button pressed - triggering earnings calculation');
        setRefreshing(true);
        fetchMonetizationStats();
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

                <TouchableOpacity 
                    style={styles.withdrawButton}
                    onPress={() => {
                        // TODO: Implement withdraw functionality
                        console.log('Withdraw button pressed');
                    }}
                >
                    <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.withdrawButtonText}>Withdraw Funds</Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );

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
                                Earnings are calculated from our Pro subscribers ($8.33/month or $100/year). 
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
    withdrawButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF'
    }
});
