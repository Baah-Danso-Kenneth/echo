'use client';

import { Post, useLikePostMutation } from '../lib/services/api';
import { Heart, MessageCircle, Repeat, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useAppSelector } from '../lib/store';
import { selectCurrentUser } from '../lib/features/auth/authSlice';
import { toast } from 'sonner';

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const user = useAppSelector(selectCurrentUser);
    const [likePost] = useLikePostMutation();

    const handleLike = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            toast.error('Please login to like posts');
            return;
        }
        try {
            await likePost(post.id).unwrap();
        } catch {
            toast.error('Failed to like post');
        }
    };

    return (
        <Link
            href={`/post/${post.id}`}
            className="block w-full p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
        >
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                        {post.author.username[0].toUpperCase()}
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white truncate">
                            {post.author.display_name}
                        </span>
                        <span className="text-sm text-gray-500 truncate">
                            @{post.author.username}
                        </span>
                        <span className="text-sm text-gray-600">·</span>
                        <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                    </div>

                    <p className="text-gray-200 mb-4 whitespace-pre-wrap break-words">
                        {post.content}
                    </p>

                    <div className="flex items-center justify-between text-gray-500 max-w-md">
                        <button
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors group"
                            onClick={(e) => {
                                e.preventDefault();
                                // Handle comment click
                            }}
                        >
                            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <span className="text-sm">{post.comment_count}</span>
                        </button>

                        <button
                            className="flex items-center gap-2 hover:text-green-400 transition-colors group"
                            onClick={(e) => {
                                e.preventDefault();
                                // Handle retweet
                            }}
                        >
                            <div className="p-2 rounded-full group-hover:bg-green-500/10 transition-colors">
                                <Repeat className="w-5 h-5" />
                            </div>
                            <span className="text-sm">0</span>
                        </button>

                        <button
                            className={`flex items-center gap-2 transition-colors group ${post.is_liked_by_current_user ? 'text-pink-500' : 'hover:text-pink-500'
                                }`}
                            onClick={handleLike}
                        >
                            <div className={`p-2 rounded-full group-hover:bg-pink-500/10 transition-colors`}>
                                <Heart className={`w-5 h-5 ${post.is_liked_by_current_user ? 'fill-current' : ''}`} />
                            </div>
                            <span className="text-sm">{post.like_count}</span>
                        </button>

                        <button
                            className="flex items-center gap-2 hover:text-blue-400 transition-colors group"
                            onClick={(e) => {
                                e.preventDefault();
                                // Handle share
                            }}
                        >
                            <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition-colors">
                                <Share className="w-5 h-5" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}
