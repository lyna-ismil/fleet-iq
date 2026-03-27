import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import queryClient from "@/lib/queryClient";

// Landing page
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Dashboard
import Login from "./pages/Login.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import DashboardLayout from "./components/layout/DashboardLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Cars from "./pages/Cars.tsx";
import Users from "./pages/Users.tsx";
import Bookings from "./pages/Bookings.tsx";
import Reclamations from "./pages/Reclamations.tsx";
import Devices from "./pages/Devices.tsx";
import Telemetry from "./pages/Telemetry.tsx";
import Notifications from "./pages/Notifications.tsx";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing page */}
          <Route path="/" element={<Index />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard (protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="cars" element={<Cars />} />
            <Route path="users" element={<Users />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="reclamations" element={<Reclamations />} />
            <Route path="devices" element={<Devices />} />
            <Route path="telemetry" element={<Telemetry />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
