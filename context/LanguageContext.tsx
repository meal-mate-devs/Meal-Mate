import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Import all translation files statically
import arTranslations from '../lib/i18n/translations/ar.json';
import deTranslations from '../lib/i18n/translations/de.json';
import enTranslations from '../lib/i18n/translations/en.json';
import esTranslations from '../lib/i18n/translations/es.json';
import frTranslations from '../lib/i18n/translations/fr.json';
import hiTranslations from '../lib/i18n/translations/hi.json';
import itTranslations from '../lib/i18n/translations/it.json';
import jaTranslations from '../lib/i18n/translations/ja.json';
import koTranslations from '../lib/i18n/translations/ko.json';
import ptTranslations from '../lib/i18n/translations/pt.json';
import ruTranslations from '../lib/i18n/translations/ru.json';
import zhTranslations from '../lib/i18n/translations/zh.json';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi' | 'ru';

interface LanguageContextType {
    language: SupportedLanguage;
    setLanguage: (lang: SupportedLanguage) => Promise<void>;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@meal_mate_language';

// Translation map
const translations: Record<SupportedLanguage, any> = {
    en: enTranslations,
    es: esTranslations,
    fr: frTranslations,
    de: deTranslations,
    it: itTranslations,
    pt: ptTranslations,
    ja: jaTranslations,
    ko: koTranslations,
    zh: zhTranslations,
    ar: arTranslations,
    hi: hiTranslations,
    ru: ruTranslations,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<SupportedLanguage>('en');
    const [isLoaded, setIsLoaded] = useState(false);

    // Load saved language on mount
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
            if (savedLanguage && isValidLanguage(savedLanguage)) {
                setLanguageState(savedLanguage as SupportedLanguage);
            }
        } catch (error) {
            console.error('Error loading saved language:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const setLanguage = async (lang: SupportedLanguage) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
            setLanguageState(lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const isValidLanguage = (lang: string): boolean => {
        return ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'].includes(lang);
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        const translationData = translations[language];
        const keys = key.split('.');
        let value: any = translationData;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        let result = typeof value === 'string' ? value : key;

        // Handle interpolation if params are provided
        if (params && typeof result === 'string') {
            Object.keys(params).forEach((paramKey) => {
                const paramValue = params[paramKey];
                result = result.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
            });
        }

        return result;
    };

    if (!isLoaded) {
        return null; // or a loading screen
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
