import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";

const pages = [
  { label: "Home", path: "/home" },
  { label: "Profile", path: "/profile" },
  { label: "FHIR Viewer", path: "/fhir-viewer" }
];

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          GlucoGuide
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          {pages.map(({ label, path }) => {
            const isActive = location.pathname === path;
            return (
              <Button
                key={path}
                color="inherit"
                onClick={() => navigate(path)}
                sx={{
                  textDecoration: isActive ? "underline" : "none",
                  fontWeight: isActive ? "bold" : "normal"
                }}
              >
                {label}
              </Button>
            );
          })}

          <Button color="inherit" onClick={handleLogout}>
            Log Out
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default NavBar;
