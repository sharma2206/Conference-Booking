import { useEffect, useState } from "react";
import dashboardService from "../../services/dashboardService";

const statCards = [
    { key: "total_halls", label: "Conference Halls", color: "purple", icon: "🏢" },
    { key: "total_bookings", label: "Total Bookings", color: "blue", icon: "📋" },
    { key: "todays_meetings", label: "Today's Meetings", color: "green", icon: "📅" },
    { key: "pending_approvals", label: "Pending Approvals", color: "amber", icon: "⏳" },
    { key: "approved_bookings", label: "Approved", color: "green", icon: "✅" },
    { key: "rejected_bookings", label: "Rejected", color: "red", icon: "❌" },
];

export default function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await dashboardService.getSummary();
                setSummary(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    if (loading) {
        return (
            <div className="loading-center">
                <div className="spinner" />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="loading-center">
                <p style={{ color: "var(--gray-500)" }}>Unable to load dashboard data.</p>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div className="stat-grid">
                {statCards.map((card) => (
                    <div className="stat-card" key={card.key}>
                        <div className={`stat-icon ${card.color}`}>
                            {card.icon}
                        </div>
                        <div>
                            <div className="stat-label">{card.label}</div>
                            <div className="stat-value">{summary[card.key] ?? 0}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
