import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import bookingService from "../../services/bookingService";
import { notifyError, notifySuccess } from "../../utils/notifications";

function StatusBadge({ status }) {
    return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function BookingDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const canApprove = Boolean(
        user?.roles?.includes("Approver") ||
        user?.roles?.includes("Admin") ||
        user?.roles?.includes("Super Admin"),
    );

    useEffect(() => {
        const loadBooking = async () => {
            try {
                const data = await bookingService.get(id);
                setBooking(data);
            } catch (error) {
                const msg = error?.response?.data?.message || "Unable to load booking.";
                setErrorMessage(msg);
                notifyError(msg);
            } finally {
                setLoading(false);
            }
        };
        loadBooking();
    }, [id]);

    const handleApprove = async () => {
        setErrorMessage("");
        setSuccessMessage("");
        setActionLoading(true);
        try {
            const updated = await bookingService.approve(id);
            setBooking(updated);
            setSuccessMessage("Booking approved successfully.");
            notifySuccess("Booking approved successfully.");
        } catch (error) {
            const msg = error?.response?.data?.message || "Unable to approve booking.";
            setErrorMessage(msg);
            notifyError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        const reason = window.prompt("Please enter a rejection reason:");
        if (!reason) return;
        setErrorMessage("");
        setSuccessMessage("");
        setActionLoading(true);
        try {
            const updated = await bookingService.reject(id, reason);
            setBooking(updated);
            setSuccessMessage("Booking rejected successfully.");
            notifySuccess("Booking rejected successfully.");
        } catch (error) {
            const msg = error?.response?.data?.message || "Unable to reject booking.";
            setErrorMessage(msg);
            notifyError(msg);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    if (errorMessage && !booking) {
        return (
            <div className="loading-center">
                <p style={{ color: "var(--danger)" }}>{errorMessage}</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Booking Details</h1>
                <div className="btn-group">
                    <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
                    <button className="btn btn-primary" onClick={() => navigate(`/bookings/${id}/edit`)}>Edit</button>
                    {booking.status === "pending" && canApprove && (
                        <>
                            <button className="btn btn-success" disabled={actionLoading} onClick={handleApprove}>
                                ✓ Approve
                            </button>
                            <button className="btn btn-danger" disabled={actionLoading} onClick={handleReject}>
                                ✕ Reject
                            </button>
                        </>
                    )}
                </div>
            </div>

            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && booking && <div className="alert alert-error">{errorMessage}</div>}

            <div className="card">
                <div className="card-body">
                    <div className="detail-grid">
                        <div className="detail-item">
                            <div className="detail-label">Title</div>
                            <div className="detail-value">{booking.title}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Hall</div>
                            <div className="detail-value">{booking.hall?.name || booking.hall_id}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Date</div>
                            <div className="detail-value">{booking.booking_date}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Time</div>
                            <div className="detail-value">{`${booking.start_time} – ${booking.end_time}`}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Department</div>
                            <div className="detail-value">{booking.department}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Participants</div>
                            <div className="detail-value">{booking.participant_count}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Status</div>
                            <div className="detail-value"><StatusBadge status={booking.status} /></div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Approval Status</div>
                            <div className="detail-value">{booking.approval?.status || "Not yet reviewed"}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Approved By</div>
                            <div className="detail-value">{booking.approval?.approver?.name || "N/A"}</div>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid var(--gray-100)", margin: "24px 0" }} />

                    {booking.approval?.remarks && (
                        <div className="detail-item" style={{ marginBottom: 20 }}>
                            <div className="detail-label">Approval Remarks</div>
                            <div className="detail-value">{booking.approval.remarks}</div>
                        </div>
                    )}

                    {booking.rejection_reason && (
                        <div className="detail-item" style={{ marginBottom: 20 }}>
                            <div className="detail-label">Rejection Reason</div>
                            <div className="detail-value" style={{ color: "var(--danger)" }}>{booking.rejection_reason}</div>
                        </div>
                    )}

                    <div className="detail-item" style={{ marginBottom: 20 }}>
                        <div className="detail-label">Purpose</div>
                        <div className="detail-value">{booking.purpose}</div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-label">Remarks</div>
                        <div className="detail-value">{booking.remarks || "No additional remarks."}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
