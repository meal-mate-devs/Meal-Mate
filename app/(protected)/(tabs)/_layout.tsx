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
                }}
            />
            <Tabs.Screen
                name="explore/index"
                options={{
                    href: '/explore',
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    href: '/profile',
                }}
            />
            <Tabs.Screen
                name="settings/index"
                options={{
                    href: '/settings',
                }}
            />
        </Tabs>
    );
}