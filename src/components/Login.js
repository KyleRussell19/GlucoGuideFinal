import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert
} from "@mui/material";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
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
        Login
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleLogin}
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

        <Button type="submit" variant="contained">
          Login
        </Button>
      </Box>

      <Box mt={2}>
        <Typography>
          <Link to="/forgot-password" style={{ textDecoration: "none", color: "blue" }}>
            Forgot Password?
          </Link>
        </Typography>
        <Typography mt={1}>
          Don’t have an account?{" "}
          <Link to="/register" style={{ textDecoration: "none", color: "blue" }}>
            Register
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default Login;
