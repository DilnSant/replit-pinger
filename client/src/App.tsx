import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import DashboardPage from "@/pages/dashboard";
import RequestersPage from "@/pages/requesters";
import ProvidersPage from "@/pages/providers";
import SettingsPage from "@/pages/settings";
import ProfilePage from "@/pages/profile";
import AdminUsersPage from "@/pages/admin-users";
import LandingPage from "@/pages/landing";
import AdminLoginPage from "@/pages/admin-login";
import NotFoundPage from "@/pages/not-found";
import ServicesListPage from "@/pages/services-list";
import AdminServicesPage from "@/pages/admin-services";
import UserManagementPage from "@/pages/user-management";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/admin-login" component={AdminLoginPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/requesters" component={RequestersPage} />
        <Route path="/providers" component={ProvidersPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/admin/usuarios" component={AdminUsersPage} />
        <Route path="/admin-services" component={AdminServicesPage} />
        <Route path="/user-management" component={UserManagementPage} />
        <Route path="/services-list" component={ServicesListPage} />
        <Route component={NotFoundPage} />
      </Switch>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;