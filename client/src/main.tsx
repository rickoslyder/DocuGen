import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global error handling here if needed
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
