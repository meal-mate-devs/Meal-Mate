export const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};



export interface Recipe {
    id: string;
    title: string;
    image: string;
    category: string;
    prepTime: number;
    rating: number;
    author: string;
    calories: number;
    weight: number;
    ingredients: Array<{
        name: string;
        amount: string;
        icon: string;
    }>;
}


export const dummyRecipes: Recipe[] = [
    {
        id: '1',
        title: 'Toast with egg and avocado',
        image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2380&q=80',
        category: 'Breakfast',
        prepTime: 15,
        rating: 4.8,
        author: 'Mary Smith',
        calories: 345,
        weight: 250,
        ingredients: [
            { name: 'Eggs', amount: '3 pc', icon: '🥚' },
            { name: 'Toast bread', amount: '2 pc', icon: '🍞' },
            { name: 'Avocado', amount: '1 pc', icon: '🥑' },
            { name: 'Tomato', amount: '1/2 pc', icon: '🍅' },
            { name: 'Cheese', amount: '70 g', icon: '🧀' },
            { name: 'Salt & Pepper', amount: 'to taste', icon: '🧂' }
        ]
    },
    {
        id: '2',
        title: 'Breakfast burrito',
        image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80',
        category: 'Breakfast',
        prepTime: 20,
        rating: 4.5,
        author: 'Stella Martin',
        calories: 420,
        weight: 350,
        ingredients: [
            { name: 'Eggs', amount: '2 pc', icon: '🥚' },
            { name: 'Tortilla', amount: '1 pc', icon: '🌮' },
            { name: 'Beans', amount: '100 g', icon: '🫘' },
            { name: 'Cheese', amount: '50 g', icon: '🧀' },
            { name: 'Bell pepper', amount: '1/2 pc', icon: '🫑' }
        ]
    },
    {
        id: '3',
        title: 'Veggie pasta',
        image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80',
        category: 'Dinner',
        prepTime: 30,
        rating: 4.6,
        author: 'John Cook',
        calories: 520,
        weight: 400,
        ingredients: [
            { name: 'Pasta', amount: '250 g', icon: '🍝' },
            { name: 'Tomatoes', amount: '3 pc', icon: '🍅' },
            { name: 'Basil', amount: '10 g', icon: '🌿' },
            { name: 'Garlic', amount: '3 cloves', icon: '🧄' },
            { name: 'Olive oil', amount: '2 tbsp', icon: '🫒' }
        ]
    }
];