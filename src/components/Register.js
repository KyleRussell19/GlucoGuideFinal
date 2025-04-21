import React, { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert
} from "@mui/material";

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Create user in Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      // If success, user is automatically logged in
      navigate("/register-details");
    } catch (err) {
      console.error("Registration error:", err);
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
        Register
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleRegister}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Email"
          variant="outlined"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <TextField
          label="Password"
          variant="outlined"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <TextField
          label="Confirm Password"
          variant="outlined"
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          required
        />

        <Button type="submit" variant="contained">
          Register
        </Button>
      </Box>

      <Box mt={2}>
        <Typography>
          Already have an account?{" "}
          <Link to="/login" style={{ textDecoration: "none", color: "blue" }}>
            Login
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default Register;
