import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

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
import NavBar from "./NavBar";

function Profile() {
  const [user] = useAuthState(auth);

  // Profile fields
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [diabetesType, setDiabetesType] = useState("");
  const [targetMin, setTargetMin] = useState("");
  const [targetMax, setTargetMax] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Toggle read-only vs. edit mode
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAge(data.age || "");
          setGender(data.gender || "");
          setHeight(data.height || "");
          setWeight(data.weight || "");
          setDiabetesType(data.diabetesType || "");
          setTargetMin(data.targetMin || "");
          setTargetMax(data.targetMax || "");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      // setDoc with merge:true to create/update doc
      await setDoc(
        docRef,
        {
          age,
          gender,
          height,
          weight,
          diabetesType,
          targetMin,
          targetMax
        },
        { merge: true }
      );

      alert("Profile updated!");
      // Switch back to read-only mode
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message);
    }
  };

  if (!user) return null; // If user not logged in
  if (loading) return <div>Loading...</div>;

  return (
    <>
      <NavBar />
      <Box
        component={Paper}
        sx={{
          maxWidth: 500,
          margin: "50px auto",
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          textAlign: "center"
        }}
      >
        <Typography variant="h5" mb={2}>
          {isEditing ? "Edit Profile" : "Your Profile"}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!isEditing ? (
          // READ-ONLY VIEW
          <div style={{ textAlign: "left" }}>
            <p><strong>Age:</strong> {age}</p>
            <p><strong>Gender:</strong> {gender}</p>
            <p><strong>Height (cm):</strong> {height}</p>
            <p><strong>Weight (kg):</strong> {weight}</p>
            <p><strong>Diabetes Type:</strong> {diabetesType}</p>
            <p><strong>Target Min:</strong> {targetMin}</p>
            <p><strong>Target Max:</strong> {targetMax}</p>

            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          </div>
        ) : (
          // EDIT MODE
          <Box
            component="form"
            onSubmit={handleSave}
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

            <Box display="flex" justifyContent="center" gap={2}>
              <Button type="submit" variant="contained">
                Save
              </Button>
              <Button
                variant="outlined"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}

export default Profile;
