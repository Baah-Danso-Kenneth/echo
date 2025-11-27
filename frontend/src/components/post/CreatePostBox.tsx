import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { postsApi } from "@/api/posts";
import { useAuth } from "@/hooks/useAuth";

const MAX_POST_LENGTH = 280;

const CreatePostBox = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [postText, setPostText] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);

  const createPostMutation = useMutation({
    mutationFn: (data: { content: string; image?: File }) =>
      postsApi.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created successfully");
      setPostText("");
      setImagePreview(null);
      setImageFile(undefined);
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || "Failed to create post";
      toast.error(message);
    },
  });

  const handlePost = async () => {
    if (!postText.trim() && !imageFile) {
      toast.error("Post cannot be empty");
      return;
    }

    if (postText.length > MAX_POST_LENGTH) {
      toast.error(`Post cannot exceed ${MAX_POST_LENGTH} characters`);
      return;
    }

    createPostMutation.mutate({ content: postText, image: imageFile });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(undefined);
  };

  const remainingChars = MAX_POST_LENGTH - postText.length;
  const isOverLimit = remainingChars < 0;

  return (
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
            placeholder="What's happening?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="min-h-[100px] resize-none border-0 text-xl p-0 focus-visible:ring-0"
            maxLength={MAX_POST_LENGTH + 50} // Allow typing a bit over to show error
          />

          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="rounded-2xl max-h-96 w-full object-cover"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <label htmlFor="image-upload">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-primary hover:bg-primary/10"
                  onClick={() => document.getElementById("image-upload")?.click()}
                >
                  <ImageIcon className="h-5 w-5" />
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />

              {postText.length > 0 && (
                <span
                  className={`text-sm ml-2 ${isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground"
                    }`}
                >
                  {remainingChars}
                </span>
              )}
            </div>

            <Button
              onClick={handlePost}
              disabled={!postText.trim() || isOverLimit || createPostMutation.isPending}
              className="rounded-full font-bold px-6"
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostBox;
