import { Home, User, LogOut, Radio } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Sidebar = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-border bg-background px-4 py-6 hidden lg:flex flex-col">
      <div className="mb-8 flex items-center gap-2">
        <Radio className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">Echo</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex items-center gap-4 px-4 py-3 rounded-full text-foreground hover:bg-secondary transition-colors"
            activeClassName="font-bold"
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xl">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Button
        onClick={handleLogout}
        variant="ghost"
        className="flex items-center gap-4 px-4 py-3 rounded-full w-full justify-start text-foreground hover:bg-secondary/80"
      >
        <LogOut className="h-6 w-6" />
        <span className="text-xl">Logout</span>
      </Button>
    </aside>
  );
};

export default Sidebar;
