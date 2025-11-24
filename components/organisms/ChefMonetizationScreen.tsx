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
}

export default function ChefMonetizationScreen() {
    const router = useRouter();
    const { profile } = useAuthContext();
    const [stats, setStats] = useState<MonetizationStats>({
        premiumRecipes: { count: 0, totalViews: 0 },
        premiumCourses: { count: 0, totalViews: 0 },
        totalEarnings: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

    const fetchMonetizationStats = async () => {
        try {
            if (!profile?.firebaseUid) return;

            const response = await fetch(`${API_BASE_URL}/chef/monetization-stats`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': profile.firebaseUid
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats({
                    premiumRecipes: data.stats.premiumRecipes || { count: 0, totalViews: 0 },
                    premiumCourses: data.stats.premiumCourses || { count: 0, totalViews: 0 },
                    totalEarnings: data.stats.totalEarnings || 0
                });
            }
        } catch (error) {
            console.error('Error fetching monetization stats:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchMonetizationStats();
    }, [profile]);

    const onRefresh = () => {
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
                    <Text style={styles.statTitle}>Total Earnings</Text>
                </View>

                <View style={styles.earningsContainer}>
                    <Text style={styles.earningsAmount}>${stats.totalEarnings.toFixed(2)}</Text>
                    <Text style={styles.earningsLabel}>Available Balance</Text>
                </View>

                <TouchableOpacity 
                    style={styles.withdrawButton}
                    onPress={() => {
                        // TODO: Implement withdraw functionality
                        console.log('Withdraw button pressed');
                    }}
                >
                    <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.withdrawButtonText}>Withdraw</Text>
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
                    {/* Overview Card */}
                    <View style={styles.overviewCard}>
                        <View style={styles.overviewHeader}>
                            <Ionicons name="stats-chart" size={24} color="#FACC15" />
                            <Text style={styles.overviewTitle}>Premium Content Overview</Text>
                        </View>
                        <Text style={styles.overviewSubtitle}>
                            Track your premium recipes and courses performance
                        </Text>
                    </View>

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

                    {/* Total Earnings Card */}
                    {renderEarningsCard()}

                    {/* Info Card */}
                    <View style={styles.infoCard}>
                        <Ionicons name="information-circle-outline" size={20} color="#60A5FA" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>How Views Work</Text>
                            <Text style={styles.infoText}>
                                Views are counted each time a user opens your premium recipe or course.
                                Higher views can help you understand content popularity.
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
    overviewCard: {
        backgroundColor: 'rgba(250, 204, 21, 0.1)',
        borderRadius: 16,
        padding: 12,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(250, 204, 21, 0.2)'
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6
    },
    overviewTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F1F5F9'
    },
    overviewSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 2
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
