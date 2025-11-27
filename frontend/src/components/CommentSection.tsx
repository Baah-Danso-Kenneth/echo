'use client';

import { useState } from 'react';
import { useCreateCommentMutation, useGetCommentsQuery, Comment } from '../lib/services/api';
import { useAppSelector } from '../lib/store';
import { selectCurrentUser } from '../lib/features/auth/authSlice';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CommentSectionProps {
    postId: number;
}

export default function CommentSection({ postId }: CommentSectionProps) {
    const [content, setContent] = useState('');
    const user = useAppSelector(selectCurrentUser);
    const { data: commentsData, isLoading: isCommentsLoading } = useGetCommentsQuery(postId);
    const [createComment, { isLoading: isCreating }] = useCreateCommentMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            await createComment({ postId, content }).unwrap();
            setContent('');
            toast.success('Comment added');
        } catch {
            toast.error('Failed to add comment');
        }
    };

    return (
        <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Comments</h3>

            {user && (
                <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 flex gap-2">
                        <input
                            type="text"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!content.trim() || isCreating}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {isCommentsLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                ) : (
                    commentsData?.items.map((comment: Comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {comment.author.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white text-sm">
                                        {comment.author.display_name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                            </div>
                        </div>
                    ))
                )}
                {commentsData?.items.length === 0 && (
                    <div className="text-center text-gray-500 text-sm">
                        No comments yet.
                    </div>
                )}
            </div>
        </div>
    );
}
