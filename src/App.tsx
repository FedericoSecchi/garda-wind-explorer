import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// HashRouter: works on any static host (GitHub Pages, Netlify, etc.)
// URL looks like: https://domain.com/app/#/  (the # avoids server-side routing)
const App = () => (
  <HashRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </HashRouter>
);

export default App;
