import { Home, User, Radio } from "lucide-react";
import { NavLink } from "@/components/NavLink";

const MobileNav = () => {
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 border-b border-border bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center gap-2 lg:hidden">
        <Radio className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold text-foreground">Echo</span>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background z-50 flex items-center justify-around lg:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground"
            activeClassName="text-foreground"
          >
            <item.icon className="h-6 w-6" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default MobileNav;
