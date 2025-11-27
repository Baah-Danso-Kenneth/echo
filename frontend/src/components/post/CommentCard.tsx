import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Comment } from "@/types";
import { formatRelativeTime } from "@/utils/formatDate";

interface CommentCardProps {
  comment: Comment;
}

const CommentCard = ({ comment }: CommentCardProps) => {
  return (
    <article className="border-b border-border p-4 hover:bg-secondary/30 transition-colors">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src="" />
          <AvatarFallback>{comment.author.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold hover:underline">{comment.author.display_name}</span>
            <span className="text-muted-foreground text-sm">
              @{comment.author.username.toLowerCase().replace(/\s/g, "")}
            </span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">
              {formatRelativeTime(comment.created_at)}
            </span>
          </div>

          <p className="text-foreground whitespace-pre-wrap break-words">{comment.content}</p>
        </div>
      </div>
    </article>
  );
};

export default CommentCard;
