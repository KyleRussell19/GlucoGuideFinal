import React, { useState, useEffect } from "react";
import NavBar from "./NavBar";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText
} from "@mui/material";

export default function FHIRPatientViewer() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load the Patient bundle on mount
  useEffect(() => {
    setLoading(true);
    fetch("/fhir/Patient?_count=50&_format=json")
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json();
      })
      .then(json => {
        const list = json.entry?.map(e => e.resource) || [];
        setPatients(list);
        if (list.length) setPatientId(list[0].id);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selected = patients.find(p => p.id === patientId);

  return (
    <>
      <NavBar />
      <Card sx={{ maxWidth: 800, m: "2rem auto" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            FHIR Patient Viewer
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Patient</InputLabel>
            <Select
              value={patientId}
              label="Patient"
              onChange={e => setPatientId(e.target.value)}
              disabled={loading}
            >
              {patients.map(p => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name?.[0]?.text || p.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loading && <CircularProgress />}

          {selected && (
            <Box>
              <Typography><strong>Email:</strong> {selected.telecom?.[0]?.value}</Typography>
              <Typography><strong>Gender:</strong> {selected.gender}</Typography>
              {selected.extension?.map(ext => (
                <Typography key={ext.url}>
                  <strong>{ext.url.split("/").pop()}:</strong>{" "}
                  {ext.valueString ?? ext.valueInteger ?? ext.valueDateTime}
                </Typography>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </>
  );
}
