export interface User {
    id: string
    name: string
    username: string
    avatar: any
}

export interface Comment {
    id: string
    author: User
    text: string
    timeAgo: string
}

export interface Post {
    id: string
    author: User
    timeAgo: string
    content: string
    image?: any | string
    likes: number
    comments: number
    isLiked: boolean
    commentsList?: Comment[]
    showComments?: boolean
    recipeDetails?: {
        cookTime?: string
        servings?: number
        difficulty?: string
        ingredients?: string[]
        instructions?: string[]
    }
}

export interface CreatePostData {
    content: string
    image?: any
}
