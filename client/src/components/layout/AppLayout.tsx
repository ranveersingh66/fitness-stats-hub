import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Scale, Dumbbell, List, Menu, Footprints, Moon, Sun, LogIn, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const navItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Weight Tracker", href: "/weight", icon: Scale },
  { title: "Workout Log", href: "/workouts", icon: Dumbbell },
  { title: "Exercises", href: "/exercises", icon: List },
  { title: "Running Log", href: "/running", icon: Footprints },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
      title="Toggle dark mode"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </Button>
  );
}

function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { login, isLoggingIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin() {
    login({ username, password });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label>Username</Label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={isLoggingIn}>
            Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppSidebar() {
  const [location] = useLocation();
  const { isAdmin, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <Sidebar className="border-r border-border/50 bg-sidebar/50 backdrop-blur-xl">
        <SidebarContent>
          <div className="p-6 pb-2 flex items-center justify-between">
            <h1 className="text-2xl font-display font-bold text-gradient flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-primary" />
              G4IND
            </h1>
            <ThemeToggle />
          </div>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="px-3 py-2 space-y-1">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.href}
                      className="hover:bg-primary/10 hover:text-primary transition-colors rounded-xl py-3"
                    >
                      <Link href={item.href} className="flex items-center gap-3">
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium text-[15px]">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Auth button at bottom of sidebar */}
          <div className="p-4 mt-auto border-t border-border/50">
            {isAdmin ? (
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={() => logout()}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            ) : (
              <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={() => setLoginOpen(true)}>
                <LogIn className="w-4 h-4" />
                Admin Login
              </Button>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAdmin, logout } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

        <AppSidebar />
        <div className="flex flex-col flex-1 w-full">
          <header className="flex md:hidden items-center justify-between h-16 px-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center">
              <SidebarTrigger>
                <Menu className="w-6 h-6" />
              </SidebarTrigger>
              <h1 className="ml-4 font-display font-bold text-lg text-foreground">G4IND</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isAdmin ? (
                <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout">
                  <LogOut className="w-5 h-5" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setLoginOpen(true)} title="Admin Login">
                  <LogIn className="w-5 h-5" />
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </SidebarProvider>
  );
}