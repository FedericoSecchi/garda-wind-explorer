import { createElement } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LanguageContext, useLanguageState } from "@/hooks/useLanguage";

function AppWithLang() {
  const langValue = useLanguageState();
  return (
    <LanguageContext.Provider value={langValue}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </LanguageContext.Provider>
  );
}

const App = () => createElement(AppWithLang);

export default App;
