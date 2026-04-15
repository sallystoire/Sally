import { Link, useLocation } from "wouter";
import { Home, ShoppingBag, Sword, Trophy, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/game", icon: Home, label: "Royaume" },
  { href: "/shop", icon: ShoppingBag, label: "Boutique" },
  { href: "/raids", icon: Sword, label: "Raids" },
  { href: "/leaderboard", icon: Trophy, label: "Classement" },
  { href: "/codes", icon: Ticket, label: "Codes" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-sidebar border-t border-sidebar-border flex items-center justify-around px-2 z-50">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;
        
        return (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
              isActive ? "text-primary" : "text-sidebar-foreground/60"
            )} data-testid={`nav-link-${item.label.toLowerCase()}`}>
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medieval uppercase tracking-wider">{item.label}</span>
            </a>
          </Link>
        );
      })}
    </nav>
  );
}
