import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert
} from "@mui/material";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function FoodLogger({ userId }) {
  const [foodName, setFoodName] = useState("");
  const [glucoseValue, setGlucoseValue] = useState("");
  const [foodDate, setFoodDate] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [minThreshold, setMinThreshold] = useState(70);
  const [maxThreshold, setMaxThreshold] = useState(180);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setMinThreshold(parseInt(data.targetMin, 10) || 70);
          setMaxThreshold(parseInt(data.targetMax, 10) || 180);
        }
      } else {
        setError("You must be logged in to log food.");
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!foodName || !glucoseValue || !foodDate) {
      setError("Please fill out food name, glucose value, and pick a date.");
      return;
    }

    try {
      const glucoseInt = parseInt(glucoseValue, 10);

      await addDoc(collection(db, "users", userId, "food_logs"), {
        food_name: foodName,
        glucose_value: glucoseInt,
        chosen_date: foodDate,
        timestamp: serverTimestamp(),
      });

      setMessage(
        `Logged ${foodName} at ${glucoseInt} mg/dL on ${foodDate.toLocaleDateString()}` +
        (glucoseInt > maxThreshold
          ? ". You’ll get an alert email shortly."
          : ".")
      );
      setFoodName("");
      setGlucoseValue("");
      setFoodDate(null);
    } catch (err) {
      console.error("Error adding food log:", err);
      setError(err.message);
    }
  };

  return (
    <Box
      component={Paper}
      sx={{
        maxWidth: 400,
        p: 3,
        borderRadius: 2,
        boxShadow: 3,
        textAlign: "center",
      }}
    >
      <Typography variant="h6" mb={2}>
        Log Your Food (Manual)
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Food Name"
          variant="outlined"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          required
        />

        <TextField
          label="Glucose Value (mg/dL)"
          variant="outlined"
          type="number"
          value={glucoseValue}
          onChange={(e) => setGlucoseValue(e.target.value)}
          required
        />

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Pick a date"
            value={foodDate}
            onChange={(newValue) => setFoodDate(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>

        <Button type="submit" variant="contained">
          Log Food
        </Button>
      </Box>
    </Box>
  );
}
