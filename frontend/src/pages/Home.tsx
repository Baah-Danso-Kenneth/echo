import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import CreatePostBox from "@/components/post/CreatePostBox";
import PostCard from "@/components/post/PostCard";
import { postsApi } from "@/api/posts";
import { Post } from "@/types";

const Home = () => {
  const {
    data: postsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: () => postsApi.getPosts(1, 20),
  });

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-2xl mx-auto border-x border-border min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
            <h1 className="text-xl font-bold">Home</h1>
          </header>

          <CreatePostBox />

          <div>
            {isLoading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading posts...</p>
              </div>
            )}

            {error && (
              <div className="p-8 text-center">
                <p className="text-destructive">Failed to load posts</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please try again later
                </p>
              </div>
            )}

            {postsData?.items && postsData.items.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to post something!
                </p>
              </div>
            )}

            {postsData?.items?.map((post: Post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
