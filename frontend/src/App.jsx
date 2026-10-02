import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/profile" element={<Profile />} />

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
