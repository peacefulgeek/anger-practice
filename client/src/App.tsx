import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Article from "./pages/Article";
import Articles from "./pages/Articles";
import About from "./pages/About";
import Assessments from "./pages/Assessments";
import Assessment from "./pages/Assessment";
import Herbs from "./pages/Herbs";
import FireToolkit from "./pages/FireToolkit";
import Privacy from "./pages/Privacy";
import SiteLayout from "./components/SiteLayout";

function Router() {
  return (
    <SiteLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/articles" component={Articles} />
        <Route path="/about" component={About} />
        <Route path="/assessments" component={Assessments} />
        <Route path="/assessments/:slug" component={Assessment} />
        <Route path="/herbs" component={Herbs} />
        <Route path="/fire-toolkit" component={FireToolkit} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/article/:slug" component={Article} />
        <Route component={NotFound} />
      </Switch>
    </SiteLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
