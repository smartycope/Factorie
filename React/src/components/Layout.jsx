import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import Container from "@mui/material/Container";
import DecisionList from "./DecisionList";
import ExplanationSidebar from "./ExplanationSidebar";
import {Box} from "@mui/material";

export default function Layout() {
    const location = useLocation();
    const excludeDecisionList = ["/dashboard", "/explanation", "/"];
    const excludeExplanation = ["/explanation", "/", "/results"];

  return (
    <div
      className="app-root"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <TopNav />
      <Container component="main" sx={{ flex: 1, py: 3, maxWidth: 1200 }}>
        <Box sx={{ display: "flex", gap: 3 }}>
          {!excludeDecisionList.includes(location.pathname) && <DecisionList />}
          <Outlet />
          {!excludeExplanation.includes(location.pathname) && <ExplanationSidebar />}
        </Box>
      </Container>
    </div>
  );
}
