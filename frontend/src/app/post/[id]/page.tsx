'use client';

import { useGetPostQuery } from '../../../lib/services/api';
import PostCard from '../../../components/PostCard';
import CommentSection from '../../../components/CommentSection';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function PostPage() {
    const params = useParams();
    const id = Number(params.id);

    const { data: post, isLoading, isError } = useGetPostQuery(id);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (isError || !post) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
                <p className="text-red-400 mb-4">Post not found or failed to load.</p>
                <Link href="/" className="text-blue-400 hover:text-blue-300">
                    Back to Feed
                </Link>
            </div>
        );
    }

    return (
        <main className="container mx-auto px-4 py-8 max-w-2xl">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Feed
            </Link>

            <PostCard post={post} />
            <CommentSection postId={post.id} />
        </main>
    );
}
