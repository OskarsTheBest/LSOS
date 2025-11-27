import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";

export default function Profile() {
  const { user, logout, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    number: "",
    user_type: "normal"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!user) return <div style={{ padding: "20px" }}>Loading...</div>;

  const isAdmin = user.user_type === "admin";

  function handleEdit() {
    if (!user) return;
    setFormData({
      name: user.name || "",
      last_name: user.last_name || "",
      number: user.number || "",
      user_type: user.user_type || "normal"
    });
    setIsEditing(true);
    setError("");
    setSuccess("");
  }

  function handleCancel() {
    setIsEditing(false);
    setError("");
    setSuccess("");
  }

  async function handleSave() {
    setError("");
    setSuccess("");
    
    const phoneRegex = /^\+?\d{7,15}$/;
    if (formData.number && !phoneRegex.test(formData.number)) {
      setError(messages.E005);
      return;
    }
    
    try {
      const updateData: any = {
        name: formData.name,
        last_name: formData.last_name,
        number: formData.number
      };
      
      // Only include user_type if user is admin
      if (isAdmin) {
        updateData.user_type = formData.user_type;
      }
      
      await updateProfile(updateData);
      setSuccess(messages.S002("Profils"));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.user_type?.[0] || messages.E004);
    }
  }

  function handleLogout() {
    alert(messages.S009);
    logout();
    navigate("/login");
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Profile</h2>
      {isAdmin && (
        <div style={{ marginBottom: "15px" }}>
          <button
            onClick={() => navigate("/admin")}
            style={{ padding: "10px 20px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            Admin Panel
          </button>
        </div>
      )}
      
      {!isEditing ? (
        <div>
          <div style={{ marginBottom: "20px" }}>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Name:</strong> {user.name || "Not set"}</p>
            <p><strong>Last Name:</strong> {user.last_name || "Not set"}</p>
            <p><strong>Number:</strong> {user.number || "Not set"}</p>
            <p><strong>User Type:</strong> {user.user_type || "normal"}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleEdit} style={{ padding: "10px 20px" }}>Edit Profile</button>
            <button onClick={handleLogout} style={{ padding: "10px 20px" }}>Logout</button>
          </div>
        </div>
      ) : (
        <div>
          {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", backgroundColor: "#ffebee", borderRadius: "4px" }}>{error}</div>}
          {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>{success}</div>}
          
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email:</label>
              <input 
                type="email" 
                value={user.email} 
                disabled 
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#f5f5f5" }}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Name:</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Last Name:</label>
              <input 
                type="text" 
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Number:</label>
              <input 
                type="text" 
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
              />
            </div>
            
            {isAdmin && (
              <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>User Type:</label>
                <select 
                  value={formData.user_type}
                  onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                >
                  <option value="normal">Normal (R)</option>
                  <option value="teacher">Teacher (S)</option>
                  <option value="admin">Admin (A)</option>
                </select>
              </div>
            )}
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Save</button>
              <button type="button" onClick={handleCancel} style={{ padding: "10px 20px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
