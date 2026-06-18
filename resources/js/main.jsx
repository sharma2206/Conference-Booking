import ReactDOM from "react-dom/client";
import App from "./src/App.jsx";
import { AuthProvider } from "./src/context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
    <AuthProvider>
        <App />
    </AuthProvider>,
);
