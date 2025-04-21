import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  TextField
} from "@mui/material";

import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

function FoodDropdown({ userId, onLogFood }) {
  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState("");
  const [foodDate, setFoodDate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "food_options"));
        const foodList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoods(foodList);
      } catch (err) {
        console.error("Error fetching food options:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  const handleSelectFood = (event) => {
    setSelectedFood(event.target.value);
  };

  const handleLogFood = async () => {
    setError("");
    setMessage("");

    if (!selectedFood) {
      setError("Please select a food item to log.");
      return;
    }
    if (!foodDate) {
      setError("Please pick a date for this food log.");
      return;
    }

    const food = foods.find((f) => f.food_name === selectedFood);
    if (!food) {
      setError("Food not found in the list.");
      return;
    }

    try {
      await addDoc(collection(db, "users", userId, "food_logs"), {
        food_name: food.food_name,
        glucose_value: food.glucose_value,
        chosen_date: foodDate,
        timestamp: serverTimestamp(),
      });
      if (onLogFood) {
        onLogFood(food.glucose_value);
      }
      setMessage(`Logged: ${food.food_name} (Glucose: ${food.glucose_value})`);
      setSelectedFood("");
      setFoodDate(null);
    } catch (err) {
      console.error("Error logging food:", err);
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
        textAlign: "center"
      }}
    >
      <Typography variant="h6" mb={2}>
        Log from Food Options
      </Typography>

      {loading && <Typography>Loading food options...</Typography>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {!loading && foods.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl sx={{ minWidth: 200, alignSelf: "center" }}>
            <InputLabel>Food</InputLabel>
            <Select
              value={selectedFood}
              label="Food"
              onChange={handleSelectFood}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {foods.map((food) => (
                <MenuItem key={food.id} value={food.food_name}>
                  {food.food_name} (Glucose: {food.glucose_value})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Pick a date"
              value={foodDate}
              onChange={(newValue) => setFoodDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>

          <Button variant="contained" onClick={handleLogFood}>
            Log Food
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default FoodDropdown;
