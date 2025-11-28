import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import PostCard from "@/components/post/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { postsApi } from "@/api/posts";
import { formatShortDate } from "@/utils/formatDate";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch user's posts
  const {
    data: postsData,
    isLoading,
  } = useQuery({
    queryKey: ["userPosts", user?.username],
    queryFn: () => postsApi.getUserPosts(user!.username, 1, 20),
    enabled: !!user?.username,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />

      <main className="lg:ml-64 min-h-screen">
        <div className="max-w-2xl mx-auto border-x border-border min-h-screen pt-14 lg:pt-0 pb-16 lg:pb-0">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Profile</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>

          <div className="relative">
            <div className="h-48 bg-gradient-to-r from-primary/20 to-accent/20"></div>

            <div className="px-4">
              <div className="flex justify-between items-start -mt-16 mb-4">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-3xl">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <Button
                  variant="outline"
                  className="mt-16 rounded-full font-bold px-6"
                  disabled
                  title="Edit profile coming soon"
                >
                  Edit profile
                </Button>
              </div>

              <div className="mb-4">
                <h2 className="text-2xl font-bold">{user.display_name}</h2>
                <div className="text-muted-foreground">@{user.username}</div>
              </div>

              {user.bio && <p className="mb-4">{user.bio}</p>}

              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Joined {formatShortDate(user.created_at)}
                </span>
              </div>

              <div className="flex gap-6 mb-4">
                <div>
                  <span className="font-bold">{postsData?.total || 0}</span>{" "}
                  <span className="text-muted-foreground">Posts</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-border">
            <div className="flex">
              <button className="flex-1 px-4 py-4 font-bold border-b-4 border-primary hover:bg-secondary/50 transition-colors">
                Posts
              </button>
            </div>
          </div>

          <div>
            {isLoading && (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading posts...</p>
              </div>
            )}

            {postsData?.items && postsData.items.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No posts yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start sharing your thoughts!
                </p>
              </div>
            )}

            {postsData?.items?.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
