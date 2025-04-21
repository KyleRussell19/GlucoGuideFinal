import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Alert
} from "@mui/material";

// MUI date pickers
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

function LoggedFoodsList({ userId }) {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  // Track which log is being edited
  const [editId, setEditId] = useState(null);
  const [editFoodName, setEditFoodName] = useState("");
  const [editGlucose, setEditGlucose] = useState("");
  const [editDate, setEditDate] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "food_logs");
    const unsub = onSnapshot(ref, (snapshot) => {
      const dataArr = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          ...d,
          chosen_date: d.chosen_date?.toDate() || null 
        };
      });
      setLogs(dataArr);
    }, (err) => setError(err.message));

    return () => unsub();
  }, [userId]);

  const handleEdit = (log) => {
    setEditId(log.id);
    setEditFoodName(log.food_name || "");
    setEditGlucose(log.glucose_value?.toString() || "");
    setEditDate(log.chosen_date || null);
  };

  const handleSave = async (logId) => {
    setError("");
    try {
      const logRef = doc(db, "users", userId, "food_logs", logId);
      await updateDoc(logRef, {
        food_name: editFoodName,
        glucose_value: parseInt(editGlucose, 10),
        chosen_date: editDate 
      });
      setEditId(null);
    } catch (err) {
      console.error("Error updating doc:", err);
      setError(err.message);
    }
  };

  const handleDelete = async (logId) => {
    setError("");
    try {
      const logRef = doc(db, "users", userId, "food_logs", logId);
      await deleteDoc(logRef);
    } catch (err) {
      console.error("Error deleting doc:", err);
      setError(err.message);
    }
  };

  return (
    <Box
      component={Paper}
      sx={{
        maxWidth: 800,
        margin: "20px auto",
        p: 3,
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <Typography variant="h6" mb={2} textAlign="center">
        All Logged Items
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!logs.length ? (
        <Typography>No items logged yet.</Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Food Name</TableCell>
                <TableCell>Glucose Value</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => {
                const isEditing = editId === log.id;
                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          variant="outlined"
                          size="small"
                          value={editFoodName}
                          onChange={(e) => setEditFoodName(e.target.value)}
                        />
                      ) : (
                        log.food_name
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <TextField
                          variant="outlined"
                          size="small"
                          type="number"
                          value={editGlucose}
                          onChange={(e) => setEditGlucose(e.target.value)}
                        />
                      ) : (
                        log.glucose_value
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            label="Choose Date"
                            value={editDate}
                            onChange={(newVal) => setEditDate(newVal)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                              />
                            )}
                          />
                        </LocalizationProvider>
                      ) : (
                        log.chosen_date
                          ? log.chosen_date.toLocaleDateString()
                          : "N/A"
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleSave(log.id)}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{ ml: 1 }}
                            onClick={() => setEditId(null)}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleEdit(log)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            sx={{ ml: 1 }}
                            onClick={() => handleDelete(log.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default LoggedFoodsList;
