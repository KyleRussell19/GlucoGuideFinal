import React, { useEffect, useState, useCallback } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  setDoc,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
  Divider,
  TextField
} from "@mui/material";

// Compute a recommended glucose range based on age and diabetes type.
function computeRecommendedRange({ age, diabetesType }) {
  let min, max;
  switch ((diabetesType || "").toLowerCase()) {
    case "type 1":
      [min, max] = [80, 140];
      break;
    case "type 2":
      [min, max] = [70, 130];
      break;
    case "gestational":
      [min, max] = [60, 105];
      break;
    default:
      [min, max] = [75, 135];
  }
  if (Number(age) >= 65) {
    min += 10;
    max += 10;
  }
  return { min, max };
}

export default function AdvancedAnalytics({ userId }) {
  // State for targets
  const [targetMin, setTargetMin] = useState(0);
  const [targetMax, setTargetMax] = useState(99999);
  const [editTargetMin, setEditTargetMin] = useState("");
  const [editTargetMax, setEditTargetMax] = useState("");
  const [savingTargets, setSavingTargets] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  const [loadingTargets, setLoadingTargets] = useState(true);

  // Profile state
  const [profile, setProfile] = useState(null);

  // State for logs & chart
  const [logs, setLogs] = useState([]);
  const [timeFilter, setTimeFilter] = useState("weekly");
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [logsError, setLogsError] = useState("");
  const [forecastData, setForecastData] = useState([]);

  // Summary stats
  const [stats, setStats] = useState(null);

  // Fetch profile & targets
  useEffect(() => {
    if (!userId) return;
    const fetchProfileAndTargets = async () => {
      setLoadingTargets(true);
      try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          // Targets
          const minVal = data.targetMin ?? 0;
          const maxVal = data.targetMax ?? 99999;
          setTargetMin(minVal);
          setTargetMax(maxVal);
          setEditTargetMin(minVal.toString());
          setEditTargetMax(maxVal.toString());
          // Profile
          setProfile({
            age: data.age,
            diabetesType: data.diabetesType,
            gender: data.gender,
            height: data.height,
            weight: data.weight,
          });
        }
      } catch (err) {
        setMetricsError(err.message);
      } finally {
        setLoadingTargets(false);
      }
    };
    fetchProfileAndTargets();
  }, [userId]);

  // Save new targets
  const handleSaveTargets = async () => {
    if (!userId) return;
    setSavingTargets(true);
    try {
      const userRef = doc(db, "users", userId);
      const newMin = parseInt(editTargetMin, 10);
      const newMax = parseInt(editTargetMax, 10);
      await setDoc(
        userRef,
        {
          targetMin: isNaN(newMin) ? 0 : newMin,
          targetMax: isNaN(newMax) ? 99999 : newMax
        },
        { merge: true }
      );
      setTargetMin(isNaN(newMin) ? 0 : newMin);
      setTargetMax(isNaN(newMax) ? 99999 : newMax);
      alert("Targets updated!");
    } catch (err) {
      setMetricsError(err.message);
    } finally {
      setSavingTargets(false);
    }
  };

  // Build Firestore query for logs
  function getQueryForFilter(filter) {
    const logsRef = collection(db, "users", userId, "food_logs");
    if (filter === "total") {
      return query(logsRef, orderBy("chosen_date", "asc"));
    }
    let rangeInDays = 7;
    if (filter === "monthly") rangeInDays = 30;
    if (filter === "yearly") rangeInDays = 365;
    const now = new Date();
    now.setDate(now.getDate() - rangeInDays);
    const startTs = Timestamp.fromDate(now);
    return query(
      logsRef,
      where("chosen_date", ">", startTs),
      orderBy("chosen_date", "asc")
    );
  }

  // Fetch logs
  useEffect(() => {
    if (!userId) return;
    setLoadingLogs(true);
    const q = getQueryForFilter(timeFilter);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setLogs([]);
          setLogsError("");
          setLoadingLogs(false);
          return;
        }
        const dataArr = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            ...d,
            timestamp: d.chosen_date?.toDate() || null
          };
        });
        setLogs(dataArr);
        setLogsError("");
        setLoadingLogs(false);
      },
      (err) => {
        setLogsError(err.message);
        setLoadingLogs(false);
      }
    );
    return () => unsubscribe();
  }, [userId, timeFilter]);

  // Naive forecast & summary stats
  useEffect(() => {
    if (!logs.length) {
      setForecastData([]);
      setStats(null);
      return;
    }
    const sum = logs.reduce((acc, item) => acc + (item.glucose_value || 0), 0);
    const avg = sum / logs.length;
    const lastTs = logs[logs.length - 1].timestamp || new Date();
    const futureData = [];
    for (let i = 1; i <= 7; i++) {
      const future = new Date(lastTs);
      future.setDate(future.getDate() + i);
      futureData.push({
        isForecast: true,
        glucose_value: Math.round(avg),
        timestamp: future
      });
    }
    setForecastData(futureData);
    const realData = logs.filter((item) => !item.isForecast);
    const statsObj = computeStats(realData);
    setStats(statsObj);
  }, [logs]);

  // Combine logs + forecast
  const combinedData = [...logs, ...forecastData].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return a.timestamp - b.timestamp;
  });

  // Chart data setup
  const chartLabels = combinedData.map((item) =>
    item.timestamp ? item.timestamp.toLocaleDateString() : "N/A"
  );
  const chartValues = combinedData.map((item) => item.glucose_value);
  const minLineData = chartLabels.map(() => targetMin);
  const maxLineData = chartLabels.map(() => targetMax);
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Glucose Value",
        data: chartValues,
        borderColor: "blue",
        borderWidth: 2,
        fill: false,
        pointBackgroundColor: combinedData.map((item) =>
          item.isForecast ? "red" : "blue"
        ),
        pointRadius: combinedData.map((item) =>
          item.isForecast ? 5 : 4
        )
      },
      {
        label: "Target Min",
        data: minLineData,
        borderColor: "green",
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
      },
      {
        label: "Target Max",
        data: maxLineData,
        borderColor: "orange",
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
      }
    ]
  };
  const chartOptions = {
    maintainAspectRatio: false,
    onClick: (evt, elements) => {
      if (!elements.length) return;
      const index = elements[0].index;
      const clickedItem = combinedData[index];
      alert(`Drill-down: ${JSON.stringify(clickedItem)}`);
    }
  };

  // Export helpers using only real logs
  const realData = combinedData.filter(item => !item.isForecast);

  const handleDownloadCSV = () => {
    if (!realData.length) return;
    let csv = "";
    if (profile) {
      csv += `Recommended Min:,${computeRecommendedRange(profile).min}\n`;
      csv += `Recommended Max:,${computeRecommendedRange(profile).max}\n\n`;
    }
    csv += "Date,Glucose\n";
    realData.forEach(({ timestamp, glucose_value }) => {
      const dateStr = timestamp ? timestamp.toLocaleDateString() : "N/A";
      csv += `${dateStr},${glucose_value}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glucose_data.csv";
    link.click();
  };

  const handleDownloadPDF = () => {
    if (!realData.length) return;
    const doc = new jsPDF();
    let y = 16;
    if (profile) {
      const { min, max } = computeRecommendedRange(profile);
      doc.text(`Recommended Range: ${min}–${max} mg/dL`, 14, y);
      y += 10;
    }
    doc.text("Glucose Report", 14, y);
    y += 6;
    const rows = realData.map(({ timestamp, glucose_value }) => [
      timestamp ? timestamp.toLocaleDateString() : "N/A",
      glucose_value
    ]);
    doc.autoTable({
      head: [["Date", "Glucose"]],
      body: rows,
      startY: y
    });
    doc.save("glucose_report.pdf");
  };

  return (
    <Box component={Paper} sx={{ maxWidth: 800, m: "20px auto", p: 3, borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h6" mb={2} textAlign="center">
        Advanced Glucose Analytics
      </Typography>

      {/* Target inputs + recommendation */}
      {profile && (
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Recommended: {computeRecommendedRange(profile).min}–{computeRecommendedRange(profile).max} mg/dL
        </Typography>
      )}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <TextField
          label="Target Min"
          variant="outlined"
          size="small"
          type="number"
          value={editTargetMin}
          onChange={(e) => setEditTargetMin(e.target.value)}
        />
        <TextField
          label="Target Max"
          variant="outlined"
          size="small"
          type="number"
          value={editTargetMax}
          onChange={(e) => setEditTargetMax(e.target.value)}
        />
        <Button
          variant="outlined"
          size="small"
          disabled={!profile}
          onClick={() => {
            const { min, max } = computeRecommendedRange(profile);
            setEditTargetMin(min.toString());
            setEditTargetMax(max.toString());
          }}
        >
          Use Recommendation
        </Button>
        <Button
          variant="contained"
          size="small"
          disabled={savingTargets}
          onClick={handleSaveTargets}
        >
          Save Targets
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {metricsError && <Alert severity="error">{metricsError}</Alert>}
      {loadingLogs ? (
        <Typography>Loading data...</Typography>
      ) : !combinedData.length ? (
        <Typography>No logs found for this range.</Typography>
      ) : (
        <Box sx={{ height: 400 }}>
          <Line data={chartData} options={chartOptions} />
        </Box>
      )}

      {/* Filter */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={timeFilter}
            label="Filter"
            onChange={(e) => {
              setLoadingLogs(true);
              setTimeFilter(e.target.value);
            }}
          >
            <MenuItem value="weekly">Weekly (Last 7 Days)</MenuItem>
            <MenuItem value="monthly">Monthly (Last 30 Days)</MenuItem>
            <MenuItem value="yearly">Yearly (Last 365 Days)</MenuItem>
            <MenuItem value="total">Total (All Logs)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats */}
      {stats && (
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Summary Stats
          </Typography>
          <Typography>Average: {stats.average.toFixed(1)}</Typography>
          <Typography>Median: {stats.median.toFixed(1)}</Typography>
          <Typography>Min: {stats.min}</Typography>
          <Typography>Max: {stats.max}</Typography>
        </Box>
      )}

      {/* Export buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
        <Button variant="outlined" onClick={handleDownloadCSV}>
          Download CSV
        </Button>
        <Button variant="outlined" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </Box>
    </Box>
  );
}

// Helper to compute stats
function computeStats(realLogs) {
  if (!realLogs.length) {
    return { average: 0, median: 0, min: 0, max: 0 };
  }
  const sorted = [...realLogs].sort((a, b) => a.glucose_value - b.glucose_value);
  const sum = sorted.reduce((acc, item) => acc + item.glucose_value, 0);
  const average = sum / sorted.length;
  const min = sorted[0].glucose_value;
  const max = sorted[sorted.length - 1].glucose_value;
  let median;
  if (sorted.length % 2 === 1) {
    median = sorted[Math.floor(sorted.length / 2)].glucose_value;
  } else {
    const mid1 = sorted[sorted.length / 2 - 1].glucose_value;
    const mid2 = sorted[sorted.length / 2].glucose_value;
    median = (mid1 + mid2) / 2;
  }
  return { average, median, min, max };
}
