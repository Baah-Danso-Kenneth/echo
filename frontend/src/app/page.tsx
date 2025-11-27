'use client';

import { useGetPostsQuery } from '../lib/services/api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { Loader2 } from 'lucide-react';
import { Post } from '../lib/services/api';

export default function Home() {
  const { data, isLoading, isError } = useGetPostsQuery({ page: 1, size: 20 });

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <CreatePost />

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-400">
            Failed to load posts. Please try again later.
          </div>
        ) : (
          <>
            {data?.items.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}
            {data?.items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No posts yet. Be the first to share something!
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}