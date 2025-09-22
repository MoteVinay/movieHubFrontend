import { useState } from "react";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const { name, email, password } = formData;
    if (isRegister && !name.trim())
      return alert("Please fill all required fields") || false;
    if (!email.trim()) return alert("Email is required") || false;
    const epattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!epattern.test(email)) return alert("Email format incorrect") || false;
    if (!password.trim()) return alert("Password is required") || false;
    const pattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
    if (!pattern.test(password))
      return (
        alert(
          "Password must contain at least one uppercase letter, one lowercase letter, one special character, one digit, and be at least 8 characters long"
        ) || false
      );
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (isRegister) {
        const { data } = await axios.post(
          "/signup",
          { ...formData },
          { withCredentials: true }
        );
        const { success } = data || {};
        if (success) {
          const { role, name } = data;
          const authInfo = { role, name };
          setAuth(authInfo);
          localStorage.setItem("auth", JSON.stringify(authInfo));
          setFormData({ name: "", email: "", password: "" });
          navigate(`/${role}/home`, { replace: true });
        }
      } else {
        const { data } = await axios.post(
          "/login",
          { ...formData },
          { withCredentials: true }
        );
        const { success } = data || {};
        if (success) {
          const { role, name, _id } = data;
          const authInfo = { role, name, _id };
          setAuth(authInfo);
          localStorage.setItem("auth", JSON.stringify(authInfo));
          setFormData({ name: "", email: "", password: "" });
          navigate(`/${role}/home`, { replace: true });
        }
      }
    } catch (error) {
      alert(
        error?.response?.data?.message || "An error occurred. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow-md p-6"
      >
        <h1 className="text-2xl font-semibold mb-4">
          {isRegister ? "Sign Up" : "Login"}
        </h1>

        {isRegister && (
          <div className="mb-3">
            <label className="block text-sm mb-1">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
              placeholder="Your name"
              required={isRegister}
              disabled={loading}
            />
          </div>
        )}

        <div className="mb-3">
          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="Password"
            required
            disabled={loading}
          />
        </div>

        <div className="flex justify-around items-center mb-4">
          
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {loading ? "Please wait..." : isRegister ? "Sign Up" : "Login"}
          </button>
        </div>

        <div className="text-center">
          <p className="text-sm mb-2">
            {isRegister ? "Already have an account?" : "Don't have an account?"}
          </p>
          <button
            type="button"
            onClick={() => setIsRegister((prev) => !prev)}
            disabled={loading}
            className="text-sm text-blue-600 underline"
          >
            {isRegister ? "Login" : "Sign Up"}
          </button>
        </div>
      </form>
    </div>
  );
}
