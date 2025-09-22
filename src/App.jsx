import "./index.css";
import { Routes, Route } from "react-router-dom";
import AdminHome from "./pages/AdminHome";
import UserHome from "./pages/UserHome";
import RequireAuth from "./components/RequireAuth";

import Start from "./pages/Login";

function App() {
  

  const ROLE = {
    Admin: "admin",
    Member: "user",
  };

  return (
    <>
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Start />} />

        {/* Admin routes */}
        <Route
          path="/admin/home"
          element={
            <RequireAuth allowedRole={ROLE.Admin}>
              <AdminHome />
            </RequireAuth>
          }
        />

        {/* User routes */}
        <Route
          path="/user/home"
          element={
            <RequireAuth allowedRole={ROLE.Member}>
              <UserHome />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}

export default App;
