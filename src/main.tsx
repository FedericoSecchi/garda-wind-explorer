import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore URL after GitHub Pages 404 redirect.
// Supabase magic link lands on e.g. /garda-wind-explorer?code=XXX — GitHub Pages
// serves 404.html, which stashes the full path+query in sessionStorage and
// redirects to the SPA root. Here we put the original URL back so the
// Supabase client can find and exchange the ?code= param.
const redirect = sessionStorage.redirect;
if (redirect) {
  sessionStorage.removeItem("redirect");
  window.history.replaceState(null, "", redirect);
}

createRoot(document.getElementById("root")!).render(<App />);
