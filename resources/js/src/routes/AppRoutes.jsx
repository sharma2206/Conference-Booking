import { Routes, Route } from "react-router-dom";
import Login from "../pages/Auth/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import HallList from "../pages/Halls/HallList";
import HallForm from "../pages/Halls/HallForm";
import HallDetails from "../pages/Halls/HallDetails";
import BookingList from "../pages/Bookings/BookingList";
import BookingForm from "../pages/Bookings/BookingForm";
import BookingDetails from "../pages/Bookings/BookingDetails";
import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";

export default function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />

            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/halls" element={<HallList />} />
                <Route path="/halls/new" element={<HallForm />} />
                <Route path="/halls/:id" element={<HallDetails />} />
                <Route path="/halls/:id/edit" element={<HallForm />} />
                <Route path="/bookings" element={<BookingList />} />
                <Route path="/bookings/new" element={<BookingForm />} />
                <Route path="/bookings/:id" element={<BookingDetails />} />
                <Route path="/bookings/:id/edit" element={<BookingForm />} />
            </Route>
        </Routes>
    );
}
