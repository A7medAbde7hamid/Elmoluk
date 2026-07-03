import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Services = lazy(() => import("./pages/Services"));
const Booking = lazy(() => import("./pages/Booking"));
const Shop = lazy(() => import("./pages/Shop"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));
const BarberDashboard = lazy(() => import("./pages/BarberDashboard"));
const Packages = lazy(() => import("./pages/Packages"));
const OffersPage = lazy(() => import("./pages/OffersPage"));
const Contact = lazy(() => import("./pages/Contact"));
const Barbers = lazy(() => import("./pages/Barbers"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/services" element={<Services />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/barber" element={<BarberDashboard />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/barbers" element={<Barbers />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
