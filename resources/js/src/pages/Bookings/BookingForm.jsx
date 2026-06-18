import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import bookingService from "../../services/bookingService";
import hallService from "../../services/hallService";
import { notifyError, notifySuccess } from "../../utils/notifications";

export default function BookingForm() {
    const { id } = useParams();
    const isEdit = Boolean(id);
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm();
    const navigate = useNavigate();
    const [halls, setHalls] = useState([]);
    const [loadingHalls, setLoadingHalls] = useState(true);
    const [loadingBooking, setLoadingBooking] = useState(isEdit);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const data = await hallService.list();
                setHalls(data.data ?? data);
            } catch (error) {
                notifyError(error?.response?.data?.message || "Unable to load halls.");
            } finally {
                setLoadingHalls(false);
            }
        };
        fetchHalls();
    }, []);

    useEffect(() => {
        if (!isEdit) return;
        const loadBooking = async () => {
            try {
                const data = await bookingService.get(id);
                reset({
                    title: data.title,
                    purpose: data.purpose,
                    hall_id: data.hall_id,
                    booking_date: data.booking_date,
                    start_time: data.start_time,
                    end_time: data.end_time,
                    department: data.department,
                    participant_count: data.participant_count,
                    remarks: data.remarks || "",
                });
            } catch (error) {
                setErrorMessage(error?.response?.data?.message || "Unable to load booking.");
            } finally {
                setLoadingBooking(false);
            }
        };
        loadBooking();
    }, [id, isEdit, reset]);

    const onSubmit = async (data) => {
        try {
            setErrorMessage("");
            if (isEdit) {
                await bookingService.update(id, data);
                notifySuccess("Booking updated successfully.");
            } else {
                await bookingService.create(data);
                notifySuccess("Booking created successfully.");
            }
            navigate("/bookings", { replace: true });
        } catch (error) {
            const msg = error?.response?.data?.message || "Unable to save booking.";
            setErrorMessage(msg);
            notifyError(msg);
        }
    };

    if (loadingBooking) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? "Update Booking" : "Create Booking"}</h1>
            </div>

            <div className="card">
                <div className="card-body">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="bk-title">Booking Title *</label>
                            <input id="bk-title" className={`form-input ${errors.title ? "error" : ""}`}
                                placeholder="e.g. Monthly Budget Review"
                                {...register("title", { required: "Title is required" })} />
                            {errors.title && <p className="form-error">{errors.title.message}</p>}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="bk-purpose">Meeting Purpose *</label>
                            <textarea id="bk-purpose" className={`form-textarea ${errors.purpose ? "error" : ""}`}
                                placeholder="Describe the meeting purpose..."
                                style={{ minHeight: 80 }}
                                {...register("purpose", { required: "Purpose is required" })} />
                            {errors.purpose && <p className="form-error">{errors.purpose.message}</p>}
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label" htmlFor="bk-hall">Hall *</label>
                                <select id="bk-hall" className={`form-select ${errors.hall_id ? "error" : ""}`}
                                    disabled={loadingHalls}
                                    {...register("hall_id", { required: "Hall is required" })}>
                                    <option value="">Select a hall</option>
                                    {halls.map((hall) => (
                                        <option key={hall.id} value={hall.id}>{hall.name}</option>
                                    ))}
                                </select>
                                {errors.hall_id && <p className="form-error">{errors.hall_id.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="bk-date">Booking Date *</label>
                                <input id="bk-date" type="date" className={`form-input ${errors.booking_date ? "error" : ""}`}
                                    {...register("booking_date", { required: "Date is required" })} />
                                {errors.booking_date && <p className="form-error">{errors.booking_date.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="bk-start">Start Time *</label>
                                <input id="bk-start" type="time" className={`form-input ${errors.start_time ? "error" : ""}`}
                                    {...register("start_time", { required: "Start time is required" })} />
                                {errors.start_time && <p className="form-error">{errors.start_time.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="bk-end">End Time *</label>
                                <input id="bk-end" type="time" className={`form-input ${errors.end_time ? "error" : ""}`}
                                    {...register("end_time", { required: "End time is required" })} />
                                {errors.end_time && <p className="form-error">{errors.end_time.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="bk-dept">Department *</label>
                                <input id="bk-dept" className={`form-input ${errors.department ? "error" : ""}`}
                                    placeholder="e.g. Finance"
                                    {...register("department", { required: "Department is required" })} />
                                {errors.department && <p className="form-error">{errors.department.message}</p>}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="bk-count">Participants *</label>
                                <input id="bk-count" type="number" className={`form-input ${errors.participant_count ? "error" : ""}`}
                                    placeholder="e.g. 20"
                                    {...register("participant_count", { required: "Required", min: { value: 1, message: "At least 1" } })} />
                                {errors.participant_count && <p className="form-error">{errors.participant_count.message}</p>}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <label className="form-label" htmlFor="bk-remarks">Remarks</label>
                            <textarea id="bk-remarks" className="form-textarea"
                                placeholder="Any special requirements..."
                                style={{ minHeight: 80 }}
                                {...register("remarks")} />
                        </div>

                        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}

                        <div className="btn-group" style={{ marginTop: 24 }}>
                            <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                        <span className="spinner spinner-sm" /> Saving...
                                    </span>
                                ) : isEdit ? "Update Booking" : "Submit Booking"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
