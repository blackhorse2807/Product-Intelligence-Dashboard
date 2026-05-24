import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/layouts/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import Upload from "@/pages/Upload";
import Products from "@/pages/Products";
import ProductDetails from "@/pages/ProductDetails";
import Jobs from "@/pages/Jobs";
import Alerts from "@/pages/Alerts";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import { ProtectedRoute, GuestRoute } from "@/components/auth/ProtectedRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="upload" element={<Upload />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="alerts" element={<Alerts />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
