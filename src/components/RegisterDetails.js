import React, { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";

function RegisterDetails() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [diabetesType, setDiabetesType] = useState("");
  const [targetMin, setTargetMin] = useState("");
  const [targetMax, setTargetMax] = useState("");
  const [error, setError] = useState("");

  if (!user) return null; // PrivateRoute should protect this

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Save to Firestore under "users/{uid}"
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        age,
        gender,
        height,
        weight,
        diabetesType,
        targetMin,
        targetMax,
        createdAt: new Date()
      });

      alert("Information saved!");
      navigate("/home");
    } catch (err) {
      console.error("Error saving details:", err);
      setError(err.message);
    }
  };

  return (
    <Box
      component={Paper}
      sx={{
        maxWidth: 500,
        margin: "100px auto",
        p: 4,
        borderRadius: 2,
        boxShadow: 3,
        textAlign: "center"
      }}
    >
      <Typography variant="h5" mb={2}>
        Additional Info
      </Typography>
      <Typography variant="body1" mb={2}>
        Please provide your details for diabetes tracking.
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
          label="Age"
          variant="outlined"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />

        <FormControl>
          <InputLabel>Gender</InputLabel>
          <Select
            value={gender}
            label="Gender"
            onChange={(e) => setGender(e.target.value)}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Height (cm)"
          variant="outlined"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />

        <TextField
          label="Weight (kg)"
          variant="outlined"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <FormControl>
          <InputLabel>Diabetes Type</InputLabel>
          <Select
            value={diabetesType}
            label="Diabetes Type"
            onChange={(e) => setDiabetesType(e.target.value)}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="Type 1">Type 1</MenuItem>
            <MenuItem value="Type 2">Type 2</MenuItem>
            <MenuItem value="Gestational">Gestational</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Target Blood Sugar Min"
          variant="outlined"
          value={targetMin}
          onChange={(e) => setTargetMin(e.target.value)}
        />

        <TextField
          label="Target Blood Sugar Max"
          variant="outlined"
          value={targetMax}
          onChange={(e) => setTargetMax(e.target.value)}
        />

        <Button type="submit" variant="contained">
          Save & Continue
        </Button>
      </Box>
    </Box>
  );
}

export default RegisterDetails;
