import { createContext, useEffect, useState } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const data = await api.post("/auth/login", {
      email,
      password,
    });

    const { token, user } = data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    const { token, user } = data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    setUser(user);

    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };

  const loadUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get("/auth/me");

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
