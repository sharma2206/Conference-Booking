import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import hallService from "../../services/hallService";
import { notifyError, notifySuccess } from "../../utils/notifications";

export default function HallForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({ defaultValues: { status: "active" } });
    const navigate = useNavigate();
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(isEdit);

    useEffect(() => {
        if (!isEdit) return;
        const loadHall = async () => {
            try {
                const data = await hallService.get(id);
                reset({
                    name: data.name,
                    code: data.code,
                    capacity: data.capacity,
                    location: data.location,
                    floor: data.floor || "",
                    description: data.description || "",
                    status: data.status || "active",
                });
            } catch (error) {
                const msg = error?.response?.data?.message || "Unable to load hall.";
                setErrorMessage(msg);
                notifyError(msg);
            } finally {
                setLoading(false);
            }
        };
        loadHall();
    }, [id, isEdit, reset]);

    const onSubmit = async (data) => {
        try {
            setErrorMessage("");
            if (isEdit) {
                await hallService.update(id, data);
                notifySuccess("Hall updated successfully.");
            } else {
                await hallService.create(data);
                notifySuccess("Hall created successfully.");
            }
            navigate("/halls", { replace: true });
        } catch (error) {
            const msg = error?.response?.data?.message || "Unable to save hall.";
            setErrorMessage(msg);
            notifyError(msg);
        }
    };

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? "Edit Hall" : "Create New Hall"}</h1>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="hall-name">Hall Name *</label>
                                <input id="hall-name" className={`form-input ${errors.name ? "error" : ""}`}
                                    placeholder="e.g. Executive Conference Room"
                                    {...register("name", { required: "Name is required" })} />
                                {errors.name && <p className="form-error">{errors.name.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="hall-code">Hall Code *</label>
                                <input id="hall-code" className={`form-input ${errors.code ? "error" : ""}`}
                                    placeholder="e.g. HALL-001"
                                    {...register("code", { required: "Code is required" })} />
                                {errors.code && <p className="form-error">{errors.code.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="hall-capacity">Capacity *</label>
                                <input id="hall-capacity" type="number" className={`form-input ${errors.capacity ? "error" : ""}`}
                                    placeholder="e.g. 40"
                                    {...register("capacity", { required: "Capacity is required", min: { value: 1, message: "Must be at least 1" } })} />
                                {errors.capacity && <p className="form-error">{errors.capacity.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="hall-location">Location *</label>
                                <input id="hall-location" className={`form-input ${errors.location ? "error" : ""}`}
                                    placeholder="e.g. Tower A"
                                    {...register("location", { required: "Location is required" })} />
                                {errors.location && <p className="form-error">{errors.location.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="hall-floor">Floor</label>
                                <input id="hall-floor" className="form-input"
                                    placeholder="e.g. 5th Floor"
                                    {...register("floor")} />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="hall-status">Status *</label>
                                <select id="hall-status" className="form-select" {...register("status", { required: "Status is required" })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="form-label" htmlFor="hall-desc">Description</label>
                            <textarea id="hall-desc" className="form-textarea"
                                placeholder="Brief description of the hall..."
                                {...register("description")} />
                        </div>

                        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

                        <div className="btn-group" style={{ marginTop: 24 }}>
                            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className="spinner spinner-sm" /> Saving...
                                    </span>
                                ) : isEdit ? "Update Hall" : "Create Hall"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
