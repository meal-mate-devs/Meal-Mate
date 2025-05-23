
import { Post } from "@/lib/types"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { JSX, default as React } from "react"
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native"

interface PostItemProps {
    post: Post
    handleLike: (postId: string) => void
    toggleComments: (postId: string) => void
    showComments: Record<string, boolean>;
    handleAddComment: (postId: string) => void;
    commentText: string;
    setCommentText: React.Dispatch<React.SetStateAction<string>>

}

export default function PostItem(
    { post, handleLike, handleAddComment, toggleComments, showComments, commentText, setCommentText }
        :
        PostItemProps): JSX.Element {

    const AddComment = (id: string): void => {
        if (commentText.trim()) {
            handleAddComment(id)
            setCommentText("")
        }
    }

    return (
        <View className="bg-zinc-800 rounded-xl mb-4 overflow-hidden border border-zinc-700">
            <View className="flex-row items-center p-4">
                <Image source={post.author.avatar} className="w-10 h-10 rounded-full border border-yellow-400" />
                <View className="ml-3 flex-1">
                    <Text className="text-white font-bold text-xl">{post.author.name}</Text>
                    <Text className="text-zinc-400 text-xs">{post.timeAgo}</Text>
                </View>
                <TouchableOpacity>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View className="px-4 pb-3">
                <Text className="text-white text-base">{post.content}</Text>
            </View>

            {post.image && (
                <View className="w-full aspect-square">
                    <Image
                        source={typeof post.image === "string" ? { uri: post.image } : post.image}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
            )}

            {post.recipeDetails && (
                <View className="px-4 py-3 bg-zinc-700 border-t border-zinc-600">
                    <View className="flex-row justify-between mb-2">
                        {post.recipeDetails.cookTime && (
                            <View className="flex-row items-center">
                                <Ionicons name="time-outline" size={16} color="#FBBF24" />
                                <Text className="text-white ml-1">{post.recipeDetails.cookTime}</Text>
                            </View>
                        )}
                        {post.recipeDetails.servings && (
                            <View className="flex-row items-center">
                                <Ionicons name="people-outline" size={16} color="#FBBF24" />
                                <Text className="text-white ml-1">Serves {post.recipeDetails.servings}</Text>
                            </View>
                        )}
                        {post.recipeDetails.difficulty && (
                            <View className="flex-row items-center">
                                <Ionicons name="speedometer-outline" size={16} color="#FBBF24" />
                                <Text className="text-white ml-1">{post.recipeDetails.difficulty}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity className="mt-1">
                        <Text className="text-yellow-400">View full recipe →</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View className="flex-row items-center justify-between px-4 py-3 border-t border-zinc-700">
                <TouchableOpacity className="flex-row items-center" onPress={() => handleLike(post.id)}>
                    <Ionicons
                        name={post.isLiked ? "heart" : "heart-outline"}
                        size={22}
                        color={post.isLiked ? "#FBBF24" : "#FFFFFF"}
                    />
                    <Text className="text-white ml-2">{post.likes}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center" onPress={() => toggleComments(post.id)}>
                    <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                    <Text className="text-white ml-2">{post.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center">
                    <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
                    <Text className="text-white ml-2">Save</Text>
                </TouchableOpacity>
            </View>

            {showComments[post.id] && (
                <View className="px-4 py-3 border-t border-zinc-700">
                    <View className="mb-3">
                        <Text className="text-white font-bold mb-2">Comments ({post.comments})</Text>

                        {post.commentsList?.map((comment) => (
                            <View key={comment.id} className="mb-2">
                                <View className="flex-row items-start">
                                    <Image source={comment.author.avatar} className="w-8 h-8 rounded-full mr-2" />
                                    <View className="bg-zinc-700 rounded-lg p-2 flex-1">
                                        <Text className="text-white font-bold text-xs">{comment.author.name}</Text>
                                        <Text className="text-white text-xs">{comment.text}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        <View className="flex-row items-center mt-2">
                            <TextInput
                                className="bg-zinc-700 rounded-full flex-1 px-4 py-2 text-white text-sm"
                                placeholder="Add a comment..."
                                placeholderTextColor="#9CA3AF"
                                value={commentText}
                                onChangeText={setCommentText}
                            />
                            <TouchableOpacity
                                className="ml-2 w-8 h-8 rounded-full justify-center items-center overflow-hidden"
                                onPress={() => AddComment(post.id)}
                            >
                                <LinearGradient colors={["#FBBF24", "#F97416"]} className="w-full h-full rounded-full absolute" />
                                <Ionicons name="send" size={16} color="#FFFFFF" className="ml-1" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
}
