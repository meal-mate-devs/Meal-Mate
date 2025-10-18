import { FirebaseOptions } from "firebase/app";

const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyBcei4EcgfDSA-nIyIWNgeTbKBt43_TRIU",
    authDomain: "meal-mate-fdb24.firebaseapp.com",
    projectId: "meal-mate-fdb24",
    storageBucket: "meal-mate-fdb24.firebasestorage.app",
    messagingSenderId: "230655221183",
    appId: "1:230655221183:web:69eeefdf8c35d0bbbdd50a",
    measurementId: "G-K5WHVHJLD2"
};

// API configuration
const apiConfig = {
    apiUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api",
    ingredientDetectionApiUrl: process.env.EXPO_PUBLIC_INGREDIENT_DETECTION_API_URL || "http://localhost:8000",
    ingredientDetectionEndpoint: "/detect",
};

export { apiConfig, firebaseConfig };

