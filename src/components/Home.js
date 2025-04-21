import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import NavBar from "./NavBar";
import AdvancedAnalytics from "./AdvancedAnalytics";
import FoodLogger from "./FoodLogger";
import FoodDropdown from "./FoodDropdown";
import LoggedFoodsList from "./LoggedFoodsList";
import { Box, Typography, Stack, Button } from "@mui/material";

function Home() {
  const [user] = useAuthState(auth);

  if (!user) {
    return <div>Please log in.</div>;
  }

  return (
    <>
      <NavBar />
      <Box sx={{ maxWidth: 1000, margin: "20px auto", p: 2 }}>
        {/* 1) Advanced Analytics on top */}
        <AdvancedAnalytics userId={user.uid} />

        {/* 2) Food logging below */}
        <Typography variant="h5" mt={4} mb={2} textAlign="center">
          Log Your Food
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="center">
          <FoodLogger userId={user.uid} />
          <FoodDropdown userId={user.uid} />
        </Stack>

        {/* 3) Table of logged items to edit/delete */}
        <Typography variant="h5" mt={4} mb={2} textAlign="center">
          View / Edit Logged Items
        </Typography>
        <LoggedFoodsList userId={user.uid} />
      </Box>
    </>
  );
}

export default Home;
