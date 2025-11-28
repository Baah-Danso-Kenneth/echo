import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PostActions from "@/components/post/PostActions";
import CommentCard from "@/components/post/CommentCard";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { postsApi } from "@/api/posts";
import { commentsApi } from "@/api/comments";
import { formatRelativeTime, formatFullDate } from "@/utils/formatDate";
import { useAuth } from "@/hooks/useAuth";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");

  const postId = parseInt(id || "0");

  // Fetch post details
  const {
    data: post,
    isLoading: postLoading,
    error: postError,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => postsApi.getPost(postId),
    enabled: !!postId,
  });

  // Fetch comments
  const {
    data: commentsData,
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => commentsApi.getPostComments(postId, 1, 50),
    enabled: !!postId,
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      commentsApi.createComment({
        content,
        post_id: postId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added");
      setCommentText("");
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to add comment";
      toast.error(message);
    },
  });

  const handleComment = async () => {
    if (!commentText.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }

    if (commentText.length > 500) {
      toast.error("Comment cannot exceed 500 characters");
      return;
    }

    createCommentMutation.mutate(commentText);
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <main className="lg:ml-64 min-h-screen">
          <div className="max-w-2xl mx-auto border-x border-border min-h-screen pt-14 lg:pt-0">
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading post...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <MobileNav />
        <main className="lg:ml-64 min-h-screen">
          <div className="max-w-2xl mx-auto border-x border-border min-h-screen pt-14 lg:pt-0">
            <div className="p-8 text-center">
              <p className="text-destructive">Post not found</p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Go Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-2xl mx-auto border-x border-border min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
            <div className="flex items-center gap-8">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Post</h1>
            </div>
          </header>

          <article className="border-b border-border p-4">
            <div className="flex gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback>
                  {post.author.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold">{post.author.display_name}</div>
                <div className="text-muted-foreground text-sm">
                  @{post.author.username.toLowerCase().replace(/\s/g, "")}
                </div>
              </div>
            </div>

            <p className="text-2xl mb-4 whitespace-pre-wrap">{post.content}</p>

            {post.image_url && (
              <div className="mb-4">
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${post.image_url}`}
                  alt="Post content"
                  className="rounded-2xl border border-border w-full max-h-[600px] object-cover"
                />
              </div>
            )}

            <div className="text-muted-foreground text-sm mb-4 pb-4 border-b border-border">
              <span title={formatFullDate(post.created_at)}>
                {formatRelativeTime(post.created_at)}
              </span>
            </div>

            <PostActions
              postId={post.id}
              initialLikes={post.like_count}
              initialComments={post.comment_count}
              initialRetweets={post.retweet_count}
              isLiked={post.is_liked_by_current_user}
              isRetweeted={post.is_retweeted_by_current_user}
            />
          </article>

          <div className="border-b border-border p-4">
            <div className="flex gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback>
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <Textarea
                  placeholder="Post your reply"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="min-h-[80px] resize-none border-0 text-lg p-0 focus-visible:ring-0"
                  maxLength={550}
                />

                <div className="flex justify-between items-center">
                  {commentText.length > 0 && (
                    <span
                      className={`text-sm ${commentText.length > 500
                        ? "text-destructive font-semibold"
                        : "text-muted-foreground"
                        }`}
                    >
                      {500 - commentText.length}
                    </span>
                  )}
                  <div className="flex-1"></div>
                  <Button
                    onClick={handleComment}
                    disabled={
                      !commentText.trim() ||
                      commentText.length > 500 ||
                      createCommentMutation.isPending
                    }
                    className="rounded-full font-bold px-6"
                  >
                    {createCommentMutation.isPending ? "Replying..." : "Reply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div>
            {commentsLoading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading comments...</p>
              </div>
            )}

            {commentsData?.items && commentsData.items.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No comments yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Be the first to comment!
                </p>
              </div>
            )}

            {commentsData?.items?.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
