
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ConfigProvider } from "./context/ConfigContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Using exact paths to avoid route matching issues */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </ConfigProvider>
      </QueryClientProvider>
    </HashRouter>
  );
};

export default App;
