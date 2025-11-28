import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostActions from "./PostActions";
import { useNavigate } from "react-router-dom";
import { Post } from "@/types";
import { formatRelativeTime } from "@/utils/formatDate";

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const navigate = useNavigate();

  return (
    <article
      className="border-b border-border p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
      onClick={() => navigate(`/post/${post.id.toString()}`)}
    >
      <div className="flex gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src="" />
          <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold hover:underline">{post.author.display_name}</span>
            <span className="text-muted-foreground text-sm">
              @{post.author.username.toLowerCase().replace(/\s/g, "")}
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">
              {formatRelativeTime(post.created_at)}
            </span>
          </div>

          <p className="text-foreground mb-3 whitespace-pre-wrap break-words">{post.content}</p>

          {post.image_url && (
            <div className="mb-3">
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}${post.image_url}`}
                alt="Post content"
                className="rounded-2xl border border-border w-full max-h-96 object-cover"
                loading="lazy"
              />
            </div>
          )}

          <PostActions
            postId={post.id}
            initialLikes={post.like_count}
            initialComments={post.comment_count}
            initialRetweets={post.retweet_count}
            isLiked={post.is_liked_by_current_user}
            isRetweeted={post.is_retweeted_by_current_user}
          />
        </div>
      </div>
    </article>
  );
};

export default PostCard;
