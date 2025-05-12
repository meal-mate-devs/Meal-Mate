import { useAuthContext } from '@/context/authContext';
import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!user.emailVerified) {
    return <Redirect href="/(auth)/verify-email" />;
  }

  return <Redirect href="/(protected)/home" />;
}
