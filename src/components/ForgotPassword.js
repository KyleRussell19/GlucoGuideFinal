import React, { useState } from "react";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert
} from "@mui/material";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent!");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(err.message);
    }
  };

  return (
    <Box
      component={Paper}
      sx={{
        maxWidth: 400,
        margin: "100px auto",
        p: 4,
        borderRadius: 2,
        boxShadow: 3,
        textAlign: "center"
      }}
    >
      <Typography variant="h5" mb={2}>
        GlucoGuide
      </Typography>
      <Typography variant="h6" mb={2}>
        Forgot Password
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleReset}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Enter your email"
          variant="outlined"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button type="submit" variant="contained">
          Send Reset Email
        </Button>
      </Box>

      <Box mt={2}>
        <Button onClick={() => navigate("/login")}>Back to Login</Button>
      </Box>
    </Box>
  );
}

export default ForgotPassword;
