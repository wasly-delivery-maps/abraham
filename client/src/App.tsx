import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import CustomerDashboard from "./pages/CustomerDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateOrder from "./pages/CreateOrder";
import DriverProfile from "./pages/DriverProfile";
import DriverSupport from "./pages/DriverSupport";
import DriverStats from "./pages/DriverStats";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerStats from "./pages/CustomerStats";
import TrackOrder from "./pages/TrackOrder";
import AdminProfile from "./pages/AdminProfile";
import AdminStats from "./pages/AdminStats";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/customer/dashboard" component={() => <ProtectedRoute component={CustomerDashboard} requiredRole="customer" />} />
      <Route path="/customer/profile" component={() => <ProtectedRoute component={CustomerProfile} requiredRole="customer" />} />
      <Route path="/customer/stats" component={() => <ProtectedRoute component={CustomerStats} requiredRole="customer" />} />
      <Route path="/customer/create-order" component={() => <ProtectedRoute component={CreateOrder} requiredRole="customer" />} />
      <Route path="/customer/track/:orderId" component={() => <ProtectedRoute component={TrackOrder} requiredRole="customer" />} />
      <Route path="/driver/dashboard" component={() => <ProtectedRoute component={DriverDashboard} requiredRole="driver" />} />
      <Route path="/driver/profile" component={() => <ProtectedRoute component={DriverProfile} requiredRole="driver" />} />
      <Route path="/driver/stats" component={() => <ProtectedRoute component={DriverStats} requiredRole="driver" />} />
      <Route path="/driver/support" component={() => <ProtectedRoute component={DriverSupport} requiredRole="driver" />} />
      <Route path="/admin/dashboard" component={() => <ProtectedRoute component={AdminDashboard} requiredRole="admin" />} />
      <Route path="/admin/profile" component={() => <ProtectedRoute component={AdminProfile} requiredRole="admin" />} />
      <Route path="/admin/stats" component={() => <ProtectedRoute component={AdminStats} requiredRole="admin" />} />
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <ChatProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ChatProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
