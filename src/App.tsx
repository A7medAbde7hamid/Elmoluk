import { Routes, Route } from "react-router";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Services from "./pages/Services";
import Booking from "./pages/Booking";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import BarberDashboard from "./pages/BarberDashboard";
import Packages from "./pages/Packages";
import OffersPage from "./pages/OffersPage";
import Contact from "./pages/Contact";
import Barbers from "./pages/Barbers";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
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
  );
}
