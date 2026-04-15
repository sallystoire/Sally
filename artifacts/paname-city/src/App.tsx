import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { setBaseUrl } from "@workspace/api-client-react";

// Pages
import Splash from "@/pages/splash";
import Game from "@/pages/game";
import Shop from "@/pages/shop";
import Raids from "@/pages/raids";
import Leaderboard from "@/pages/leaderboard";
import Codes from "@/pages/codes";
import NotFound from "@/pages/not-found";

// Auth
import { useAuth } from "@/lib/discord/useAuth";
import { Spinner } from "@/components/ui/spinner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

setBaseUrl("/api");

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && location === "/") {
      setLocation("/game");
    }
  }, [isAuthenticated, location, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-green-900 font-medieval text-white gap-4">
        <Spinner className="w-12 h-12 border-primary" />
        <p className="text-xl animate-pulse">Chargement de Paname City...</p>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Splash} />
      <Route path="/game">
        <AuthWrapper>
          <Game />
        </AuthWrapper>
      </Route>
      <Route path="/shop">
        <AuthWrapper>
          <Shop />
        </AuthWrapper>
      </Route>
      <Route path="/raids">
        <AuthWrapper>
          <Raids />
        </AuthWrapper>
      </Route>
      <Route path="/leaderboard">
        <AuthWrapper>
          <Leaderboard />
        </AuthWrapper>
      </Route>
      <Route path="/codes">
        <AuthWrapper>
          <Codes />
        </AuthWrapper>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
