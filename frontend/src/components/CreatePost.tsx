'use client';

import { useState } from 'react';
import { useCreatePostMutation } from '../lib/services/api';
import { useAppSelector } from '../lib/store';
import { selectCurrentUser } from '../lib/features/auth/authSlice';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

export default function CreatePost() {
    const [content, setContent] = useState('');
    const user = useAppSelector(selectCurrentUser);
    const [createPost, { isLoading }] = useCreatePostMutation();

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        try {
            await createPost({ content }).unwrap();
            setContent('');
            toast.success('Post created successfully');
        } catch {
            toast.error('Failed to create post');
        }
    };

    return (
        <div className="w-full p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl mb-6">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {user.username[0].toUpperCase()}
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's happening?"
                        className="w-full bg-transparent text-white placeholder-gray-500 text-lg resize-none focus:outline-none min-h-[100px]"
                        maxLength={280}
                    />
                    <div className="flex justify-between items-center mt-4 border-t border-white/10 pt-4">
                        <span className="text-xs text-gray-500">
                            {content.length}/280
                        </span>
                        <button
                            type="submit"
                            disabled={!content.trim() || isLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Post</span>
                                    <Send className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
