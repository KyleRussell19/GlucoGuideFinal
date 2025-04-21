import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// Material UI imports
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Link,
} from "@mui/material";

function AuthPage() {
  const [isRegister, setIsRegister] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [error, setError] = useState("");

  // Clears form fields and error state
  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPass("");
    setHeight("");
    setWeight("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // If we are in "Register" mode, check password match
    if (isRegister && password !== confirmPass) {
      setError("Passwords do not match.");
      return;
    }

    try {
      if (isRegister) {

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send verification email
        await sendEmailVerification(user);

        // Store additional profile info in Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          height: height,
          weight: weight,
          createdAt: new Date(),
        });

        alert("Registration successful! A verification email was sent.");
        clearForm();
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Login successful!");
        clearForm();
      }
    } catch (err) {
      console.error("Auth error:", err);
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
        textAlign: "center",
      }}
    >
      <Typography variant="h5" mb={2}>
        GlucoGuide Authentication
      </Typography>
      <Typography variant="h6" mb={2}>
        {isRegister ? "Register" : "Login"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
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

        {isRegister && (
          <TextField
            label="Confirm Password"
            variant="outlined"
            type="password"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            required
          />
        )}

        {isRegister && (
          <>
            <TextField
              label="Height"
              variant="outlined"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <TextField
              label="Weight"
              variant="outlined"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </>
        )}

        <Button type="submit" variant="contained">
          {isRegister ? "Register" : "Login"}
        </Button>
      </Box>

      <Box mt={2}>
        {isRegister ? (
          <Typography>
            Already have an account?{" "}
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                setIsRegister(false);
                clearForm();
              }}
            >
              Login
            </Link>
          </Typography>
        ) : (
          <Typography>
            Don’t have an account?{" "}
            <Link
              component="button"
              variant="body2"
              onClick={() => {
                setIsRegister(true);
                clearForm();
              }}
            >
              Register
            </Link>
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default AuthPage;
