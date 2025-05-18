import { useAuthContext } from '@/context/authContext';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthContext();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      // try {
      //   const value = await AsyncStorage.getItem('onboardingComplete');
      //   setOnboardingComplete(value === 'true');
      // } catch (error) {
      //   console.log('Error checking onboarding status:', error);
      //   setOnboardingComplete(false);
      // }
      setOnboardingComplete(false)
    };

    checkOnboarding();
  }, []);

  if (isLoading || onboardingComplete === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600 font-poppins">Loading...</Text>
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href={"/(onboarding)" as "/(onboarding)/index"} />
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return <Redirect href="/(protected)/(tabs)/home" />;
}