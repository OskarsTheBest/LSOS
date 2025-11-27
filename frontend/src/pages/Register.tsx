import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";

export default function Register() {
  const { register } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    if (!confirmPassword.trim()) {
      setError(messages.E001("Paroles apstiprinājums"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(messages.E006);
      return false;
    }
    if (password !== confirmPassword) {
      setError(messages.E008);
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
      await register(email, password);
      setSuccess(messages.S007);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err: any) {
      if (err.response?.data?.email?.[0]) {
        setError(messages.E003(email));
      } else {
        setError(err.response?.data?.detail || "Reģistrācija neizdevās. Mēģiniet vēlreiz.");
      }
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Register</h2>
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
        <input 
          type="password" 
          placeholder="Confirm Password" 
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)} 
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        {error && <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: "10px" }}>{success}</div>}
        <button type="submit" style={{ width: "100%", padding: "10px" }}>Register</button>
      </form>
      <p style={{ marginTop: "10px" }}>
        Already have an account? <a href="/login">Login here</a>
      </p>
    </div>
  );
}
