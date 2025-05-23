import { Post } from "../types";

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


export const INITIAL_POSTS: Post[] = [
    {
        id: "1",
        author: {
            id: "1",
            name: "Jessica Parker",
            username: "chef_jessica",
            avatar: require("../../assets/images/avatar.png"),
        },
        timeAgo: "2h ago",
        content:
            "Just perfected my grandmother's homemade pasta recipe! The secret is in kneading the dough for exactly 8 minutes. Who else loves making pasta from scratch?",
        image: "https://images.unsplash.com/photo-1556761223-4c4282c73f77?q=80&w=1000&auto=format&fit=crop",
        likes: 24,
        comments: 8,
        isLiked: false,
        recipeDetails: {
            cookTime: "45 minutes",
            servings: 4,
            difficulty: "Medium",
            ingredients: ["2 cups all-purpose flour", "3 large eggs", "1/2 tsp salt", "1 tbsp olive oil"],
            instructions: [
                "Mix flour and salt in a bowl",
                "Create a well and add eggs and oil",
                "Mix until dough forms",
                "Knead for 8 minutes until smooth",
                "Rest for 30 minutes covered",
                "Roll and cut as desired",
            ],
        },
        commentsList: [
            {
                id: "c1",
                author: {
                    id: "2",
                    name: "Alex Thompson",
                    username: "pasta_lover",
                    avatar: require("../../assets/images/avatar.png"),
                },
                text: "I've been trying to perfect my pasta dough for months! Will definitely try your 8-minute kneading tip!",
                timeAgo: "1h ago",
            },
        ],
    },
    {
        id: "2",
        author: {
            id: "2",
            name: "Michael Chen",
            username: "chef_michael",
            avatar: require("../../assets/images/avatar.png"),
        },
        timeAgo: "5h ago",
        content:
            "Made this incredible Thai red curry last night! The key is balancing the spice with coconut milk. Swipe for the full recipe and let me know if you try it!",
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=1000&auto=format&fit=crop",
        likes: 56,
        comments: 12,
        isLiked: true,
        recipeDetails: {
            cookTime: "30 minutes",
            servings: 4,
            difficulty: "Easy",
            ingredients: [
                "2 tbsp red curry paste",
                "1 can coconut milk",
                "1 lb chicken breast, sliced",
                "1 red bell pepper, sliced",
                "1 cup bamboo shoots",
                "2 tbsp fish sauce",
                "1 tbsp brown sugar",
                "Fresh basil leaves",
            ],
            instructions: [
                "Heat oil in a large pan over medium heat",
                "Add curry paste and cook for 1 minute",
                "Add coconut milk and bring to simmer",
                "Add chicken and cook for 5 minutes",
                "Add vegetables and cook for 3 more minutes",
                "Season with fish sauce and sugar",
                "Garnish with fresh basil",
            ],
        },
        commentsList: [
            {
                id: "c2",
                author: {
                    id: "5",
                    name: "Lisa Wong",
                    username: "spice_enthusiast",
                    avatar: require("../../assets/images/avatar.png"),
                },
                text: "Your curry looks amazing! What brand of curry paste do you recommend?",
                timeAgo: "3h ago",
            },
        ],
    },
    {
        id: "3",
        author: {
            id: "3",
            name: "Sarah Johnson",
            username: "baking_queen",
            avatar: require("../../assets/images/avatar.png"),
        },
        timeAgo: "1d ago",
        content:
            "Just got my hands on this amazing new stand mixer! Made these chocolate chip cookies as the first test - they turned out perfect with crispy edges and chewy centers!",
        image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1000&auto=format&fit=crop",
        likes: 18,
        comments: 5,
        isLiked: false,
        recipeDetails: {
            cookTime: "25 minutes",
            servings: 24,
            difficulty: "Easy",
            ingredients: [
                "2 1/4 cups all-purpose flour",
                "1 tsp baking soda",
                "1 tsp salt",
                "1 cup butter, softened",
                "3/4 cup granulated sugar",
                "3/4 cup packed brown sugar",
                "2 large eggs",
                "2 tsp vanilla extract",
                "2 cups chocolate chips",
            ],
            instructions: [
                "Preheat oven to 375°F (190°C)",
                "Mix flour, baking soda, and salt in a small bowl",
                "Beat butter and sugars until creamy",
                "Add eggs one at a time, then vanilla",
                "Gradually beat in flour mixture",
                "Stir in chocolate chips",
                "Drop by rounded tablespoon onto baking sheets",
                "Bake for 9-11 minutes until golden brown",
            ],
        },
        commentsList: [
            {
                id: "c3",
                author: {
                    id: "6",
                    name: "David Miller",
                    username: "sweet_tooth",
                    avatar: require("../../assets/images/avatar.png"),
                },
                text: "Those cookies look incredible! Do you think I could substitute almond flour?",
                timeAgo: "12h ago",
            },
        ],
    },
    {
        id: "4",
        author: {
            id: "4",
            name: "Robert Kim",
            username: "bbq_master",
            avatar: require("../../assets/images/avatar.png"),
        },
        timeAgo: "2d ago",
        content:
            "Weekend BBQ success! Smoked these ribs for 6 hours using my 3-2-1 method. The meat was falling off the bone! Who wants the recipe for my special dry rub?",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1000&auto=format&fit=crop",
        likes: 42,
        comments: 15,
        isLiked: false,
        recipeDetails: {
            cookTime: "6 hours",
            servings: 6,
            difficulty: "Medium",
            ingredients: [
                "2 racks pork ribs",
                "1/4 cup brown sugar",
                "2 tbsp paprika",
                "1 tbsp black pepper",
                "1 tbsp garlic powder",
                "1 tbsp onion powder",
                "1 tsp cayenne pepper",
                "1/4 cup apple juice (for spritz)",
            ],
            instructions: [
                "Remove membrane from back of ribs",
                "Apply dry rub generously on both sides",
                "Smoke at 225°F for 3 hours, spritzing occasionally",
                "Wrap in foil with some apple juice and cook for 2 more hours",
                "Unwrap and cook for 1 final hour, applying sauce if desired",
                "Rest for 15 minutes before cutting",
            ],
        },
        commentsList: [],
    },
]