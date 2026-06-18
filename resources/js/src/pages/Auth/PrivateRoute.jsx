export default function PrivateRoute() {
    return (
        <div className="flex items-center justify-center h-screen">
            <h1 className="text-2xl font-bold">
                This is a private route. You must be logged in to view this
                page.
            </h1>
        </div>
    );
}
