import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import hallService from "../../services/hallService";
import { notifyError } from "../../utils/notifications";

function StatusBadge({ status }) {
    return <span className={`badge badge-${status}`}>{status}</span>;
}

export default function HallList() {
    const navigate = useNavigate();
    const [halls, setHalls] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const data = await hallService.list();
                setHalls(data.data ?? data);
            } catch (error) {
                notifyError(error?.response?.data?.message || "Unable to load halls.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchHalls();
    }, []);

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Hall Management</h1>
                <button className="btn btn-primary" onClick={() => navigate("/halls/new")}>
                    + Add Hall
                </button>
            </div>

            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Location</th>
                            <th>Capacity</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {halls.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="empty-state"><p>No halls found.</p></div>
                                </td>
                            </tr>
                        ) : (
                            halls.map((hall) => (
                                <tr key={hall.id} onClick={() => navigate(`/halls/${hall.id}`)}>
                                    <td style={{ fontWeight: 600, color: "var(--gray-800)" }}>{hall.name}</td>
                                    <td>{hall.code}</td>
                                    <td>{hall.location}</td>
                                    <td>{hall.capacity}</td>
                                    <td><StatusBadge status={hall.status} /></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
