import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthProvider";

ReactDOM.createRoot(document.getElementById("app")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* <ThemeProvider> */}
          <Routes>
            <Route path="/*" element={<App />} />
          </Routes>
        {/* </ThemeProvider> */}
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
