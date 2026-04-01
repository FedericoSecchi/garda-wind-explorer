import { createElement, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LanguageContext, useLanguageState } from "@/hooks/useLanguage";
import { AuthProvider } from "@/contexts/AuthContext";
import { initAnalytics } from "@/lib/analytics";

function AppWithLang() {
  const langValue = useLanguageState();

  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <LanguageContext.Provider value={langValue}>
      <AuthProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </AuthProvider>
    </LanguageContext.Provider>
  );
}

const App = () => createElement(AppWithLang);

export default App;
