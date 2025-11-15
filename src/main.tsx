import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Import test database function to make it available globally
import "./lib/testDatabase";

createRoot(document.getElementById("root")!).render(<App />);
