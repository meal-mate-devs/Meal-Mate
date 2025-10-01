export interface User {
    id: string
    mongoId: string
    name: string
    username: string
    avatar: any // For require() images
    isVerified?: boolean
    followerCount?: number
    recipeCount?: number
    totalLikes?: number
    badges?: Badge[]
    rank?: number
}

export interface Badge {
    id: string
    name: string
    icon: string
    color: string
    description: string
    unlockedAt?: string
}

export interface Comment {
    id: string
    author: User
    text: string
    timeAgo: string
    likes?: number
    isLiked?: boolean
}

export interface Post {
    id: string
    author: User
    timeAgo: string
    content: string
    images: (any | string)[]
    likes: number
    comments: number
    saves: number
    isLiked: boolean
    isSaved: boolean
    commentsList?: Comment[]
    showComments?: boolean
    recipeDetails?: {
        title?: string
        cookTime?: string
        servings?: number
        difficulty?: string
        ingredients?: string[]
        instructions?: string[]
        category?: string
        tags?: string[]
    }
}

export interface CreatePostData {
    content: string
    images?: (any | string)[]
    recipeDetails?: {
        title: string
        cookTime: string
        servings: number
        difficulty: string
        ingredients: string[]
        instructions: string[]
        category: string
        tags: string[]
    }
    postType?: "simple" | "recipe";

}

export interface LeaderboardEntry {
    user: User
    position: number
    totalLikes: number
    totalPosts: number
    engagementScore: number
    change: number
}
