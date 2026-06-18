import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import bookingService from "../../services/bookingService";
import { notifyError } from "../../utils/notifications";

function StatusBadge({ status }) {
    return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function BookingList() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await bookingService.list();
                setBookings(data.data ?? data);
            } catch (error) {
                notifyError(error?.response?.data?.message || "Unable to load bookings.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Booking Requests</h1>
                <button className="btn btn-primary" onClick={() => navigate("/bookings/new")}>
                    + New Booking
                </button>
            </div>

            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Hall</th>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bookings.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state"><p>No bookings found.</p></div>
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking.id} onClick={() => navigate(`/bookings/${booking.id}`)}>
                                    <td style={{ fontWeight: 600, color: "var(--gray-800)" }}>{booking.title}</td>
                                    <td>{booking.hall?.name || booking.hall_id}</td>
                                    <td>{booking.booking_date}</td>
                                    <td>{`${booking.start_time} – ${booking.end_time}`}</td>
                                    <td><StatusBadge status={booking.status} /></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
