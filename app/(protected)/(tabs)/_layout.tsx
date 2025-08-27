import CustomTabBar from "@/components/organisms/CustomTabBar";
import { Tabs } from "expo-router";
import React from "react";

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
                    title: 'Home',
                    tabBarLabel: 'Home',
                    tabBarIcon: () => null,
                }}
            />
            <Tabs.Screen
                name="create/index"
                options={{
                    title: 'Create',
                    tabBarLabel: 'Create',
                }}
            />
            <Tabs.Screen
                name="statistics/index"
                options={{
                    title: 'Statistics',
                    tabBarLabel: 'Statistics',
                }}
            />
            <Tabs.Screen
                name="community/index"
                options={{
                    title: 'Community',
                    tabBarLabel: 'Community',
                }}
            />
            <Tabs.Screen
                name="chef/index"
                options={{
                    title: 'Chef',
                    tabBarLabel: 'Chef',
                }}
            />
            <Tabs.Screen name="(hidden)" options={{ href: null }} />
        </Tabs>
    );
}