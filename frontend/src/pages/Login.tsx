import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  function validateForm() {
    if (!email.trim()) {
      setError(messages.E001("E-pasts"));
      return false;
    }
    if (!password.trim()) {
      setError(messages.E001("Parole"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(messages.E006);
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      setSuccess(messages.S008);
      setTimeout(() => navigate("/profile"), 800);
    } catch (err: any) {
      setError(messages.E007);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email"
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)} 
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={e => setPassword(e.target.value)} 
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: "10px" }}>{success}</div>}
        <button type="submit" style={{ width: "100%", padding: "10px" }}>Login</button>
      </form>
      <p style={{ marginTop: "10px" }}>
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  );
}
