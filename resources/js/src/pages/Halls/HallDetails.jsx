import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import hallService from "../../services/hallService";
import { notifyError } from "../../utils/notifications";

export default function HallDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hall, setHall] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const loadHall = async () => {
            try {
                const data = await hallService.get(id);
                setHall(data);
            } catch (error) {
                const msg = error?.response?.data?.message || "Unable to load hall.";
                setErrorMessage(msg);
                notifyError(msg);
            } finally {
                setLoading(false);
            }
        };
        loadHall();
    }, [id]);

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    if (errorMessage) {
        return (
            <div className="loading-center">
                <p style={{ color: "var(--danger)" }}>{errorMessage}</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Hall Details</h1>
                <div className="btn-group">
                    <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
                    <button className="btn btn-primary" onClick={() => navigate(`/halls/${id}/edit`)}>Edit Hall</button>
                </div>
            </div>

            <div className="card">
                <div className="card-body">
                    <div className="detail-grid">
                        <div className="detail-item">
                            <div className="detail-label">Name</div>
                            <div className="detail-value">{hall.name}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Code</div>
                            <div className="detail-value">{hall.code}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Location</div>
                            <div className="detail-value">{hall.location}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Floor</div>
                            <div className="detail-value">{hall.floor || "N/A"}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Capacity</div>
                            <div className="detail-value">{hall.capacity} seats</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Status</div>
                            <div className="detail-value">
                                <span className={`badge badge-${hall.status}`}>{hall.status}</span>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid var(--gray-100)", margin: "24px 0" }} />

                    <div className="detail-item" style={{ marginBottom: 20 }}>
                        <div className="detail-label">Description</div>
                        <div className="detail-value">{hall.description || "No description provided."}</div>
                    </div>

                    <div className="detail-item">
                        <div className="detail-label">Facilities</div>
                        <div className="detail-value">
                            {hall.facilities?.length > 0
                                ? hall.facilities.map((f) => f.facility).join(", ")
                                : "No facilities configured."}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
