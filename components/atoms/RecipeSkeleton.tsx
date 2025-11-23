import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const RecipeSkeleton: React.FC = () => {
    return (
        <View style={styles.card}>
            {/* Image skeleton */}
            <View style={styles.imageSkeleton}>
                <LinearGradient
                    colors={['#27272a', '#3f3f46', '#27272a']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {/* Content skeleton */}
            <View style={styles.content}>
                {/* Title skeleton */}
                <View style={styles.titleSkeleton}>
                    <LinearGradient
                        colors={['#27272a', '#3f3f46', '#27272a']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </View>

                {/* Description skeleton - two lines */}
                <View style={styles.descriptionContainer}>
                    <View style={styles.descriptionLine1}>
                        <LinearGradient
                            colors={['#27272a', '#3f3f46', '#27272a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                    <View style={styles.descriptionLine2}>
                        <LinearGradient
                            colors={['#27272a', '#3f3f46', '#27272a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                </View>

                {/* Meta info skeleton */}
                <View style={styles.metaContainer}>
                    <View style={styles.metaSkeleton}>
                        <LinearGradient
                            colors={['#27272a', '#3f3f46', '#27272a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                    <View style={styles.metaSkeleton}>
                        <LinearGradient
                            colors={['#27272a', '#3f3f46', '#27272a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                    <View style={styles.metaSkeleton}>
                        <LinearGradient
                            colors={['#27272a', '#3f3f46', '#27272a']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#18181b',
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    imageSkeleton: {
        width: 120,
        height: 120,
        borderRadius: 12,
        margin: 12,
        overflow: 'hidden',
    },
    content: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    titleSkeleton: {
        height: 20,
        borderRadius: 4,
        marginBottom: 8,
        width: '80%',
        overflow: 'hidden',
    },
    descriptionContainer: {
        marginBottom: 12,
    },
    descriptionLine1: {
        height: 14,
        borderRadius: 4,
        marginBottom: 6,
        width: '100%',
        overflow: 'hidden',
    },
    descriptionLine2: {
        height: 14,
        borderRadius: 4,
        width: '70%',
        overflow: 'hidden',
    },
    metaContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    metaSkeleton: {
        height: 16,
        width: 60,
        borderRadius: 4,
        overflow: 'hidden',
    },
});

export default RecipeSkeleton;
