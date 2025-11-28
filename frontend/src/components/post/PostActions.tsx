import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Repeat2, Share } from "lucide-react";
import { toast } from "sonner";
import { engagementsApi } from "@/api/engagements";

interface PostActionsProps {
  postId: number;
  initialLikes: number;
  initialComments: number;
  initialRetweets: number;
  isLiked: boolean;
  isRetweeted: boolean;
}

const PostActions = ({
  postId,
  initialLikes,
  initialComments,
  initialRetweets,
  isLiked: initialIsLiked,
  isRetweeted: initialIsRetweeted,
}: PostActionsProps) => {
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isReposted, setIsReposted] = useState(initialIsRetweeted);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [repostCount, setRepostCount] = useState(initialRetweets);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: () => engagementsApi.likePost(postId),
    onMutate: async () => {
      // Optimistic update
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: () => {
      // Revert on error
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
      toast.error("Failed to like post");
    },
  });

  // Unlike mutation
  const unlikeMutation = useMutation({
    mutationFn: () => engagementsApi.unlikePost(postId),
    onMutate: async () => {
      // Optimistic update
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: () => {
      // Revert on error
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      toast.error("Failed to unlike post");
    },
  });

  // Retweet mutation
  const retweetMutation = useMutation({
    mutationFn: () => engagementsApi.retweetPost(postId),
    onMutate: async () => {
      // Optimistic update
      setIsReposted(true);
      setRepostCount((prev) => prev + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("Retweeted successfully");
    },
    onError: () => {
      // Revert on error
      setIsReposted(false);
      setRepostCount((prev) => prev - 1);
      toast.error("Failed to retweet");
    },
  });

  // Unretweet mutation
  const unretweetMutation = useMutation({
    mutationFn: () => engagementsApi.unretweetPost(postId),
    onMutate: async () => {
      // Optimistic update
      setIsReposted(false);
      setRepostCount((prev) => prev - 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      toast.success("Retweet removed");
    },
    onError: () => {
      // Revert on error
      setIsReposted(true);
      setRepostCount((prev) => prev + 1);
      toast.error("Failed to remove retweet");
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReposted) {
      unretweetMutation.mutate();
    } else {
      retweetMutation.mutate();
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigation is handled by parent PostCard click
  };

  return (
    <div className="flex items-center justify-between max-w-md -ml-2">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary hover:bg-primary/10 group"
        onClick={handleComment}
      >
        <MessageCircle className="h-5 w-5 mr-2 group-hover:fill-primary/20" />
        <span className="text-sm">{initialComments}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`hover:text-green-500 hover:bg-green-500/10 group ${isReposted ? "text-green-500" : "text-muted-foreground"
          }`}
        onClick={handleRepost}
        disabled={retweetMutation.isPending || unretweetMutation.isPending}
      >
        <Repeat2 className="h-5 w-5 mr-2" />
        <span className="text-sm">{repostCount}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={`hover:text-red-500 hover:bg-red-500/10 group ${isLiked ? "text-red-500" : "text-muted-foreground"
          }`}
        onClick={handleLike}
        disabled={likeMutation.isPending || unlikeMutation.isPending}
      >
        <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-red-500" : ""}`} />
        <span className="text-sm">{likeCount}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
        onClick={handleShare}
      >
        <Share className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default PostActions;
