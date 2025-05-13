import CustomTabBar from "@/components/organisms/CustomTabBar";
import { Tabs } from "expo-router";


const screenOptions = {
    headerShown: false,
    tabBarShowLabel: false,
    freezeOnBlur: true,
};

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={screenOptions}
            tabBar={(props) => <CustomTabBar {...props} />}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    href: '/home',
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: () => null,
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    href: '/profile',
                    title: 'Profile',
                    tabBarLabel: 'Profile',
                }}
            />
            <Tabs.Screen
                name="statistics/index"
                options={{
                    href: '/statistics',
                    title: 'Statistics',
                    tabBarLabel: 'Statistics',
                }}
            />
            <Tabs.Screen
                name="settings/index"
                options={{
                    href: '/settings',
                    title: 'Settings',
                    tabBarLabel: 'Settings',
                }}
            />
        </Tabs>
    );
}