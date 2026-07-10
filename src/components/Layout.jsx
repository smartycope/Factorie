import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import Container from "@mui/material/Container";
import ExplanationSidebar from "./ExplanationSidebar";
import {Box, Snackbar} from "@mui/material";
import {useToast} from "../contexts/UseToast";

export default function Layout() {
    const location = useLocation();
    const {toastText, toast, toastDuration} = useToast();
    const excludeExplanation = ["/explanation", "/", "/results"];

  return (
    <div
      className="app-root"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <TopNav />
      <Container component="main" sx={{ flex: 1, py: 3, maxWidth: 1200 }}>
        <Box sx={{ display: "flex", gap: 3 }}>
          <Outlet />
          {!excludeExplanation.includes(location.pathname) && <ExplanationSidebar />}
        </Box>
      </Container>
      <Snackbar
        open={!!toastText}
        autoHideDuration={toastDuration}
        onClose={() => toast(null)}
        message={toastText}
      />
    </div>
  );
}
