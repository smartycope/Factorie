import { useContext } from "react";
import Box from "@mui/material/Box";
import { Typography } from "@mui/material";
import texts from "../assets/texts.json";
import ShowExplanationsContext from "../contexts/ShowExplanationsContext";
import {useLocation} from "react-router-dom";

export default function ExplanationSidebar() {

  const { showExplanations } = useContext(ShowExplanationsContext);
  const location = useLocation();
  const page = location.pathname.replace("/", "");

  if (!showExplanations) return null;
  return (
    <Box
      sx={{
        width: 300,
        minWidth: 200,
        maxWidth: 500,
        borderLeft: "1px solid #ccc",
        paddingLeft: 2,
      }}
    >
      <Typography variant="h5">Explanation</Typography>
      <br />
      <Typography variant="body2" sx={{ whiteSpace: "pre-line", fontSize: 14 }}>
        {texts[page.toLowerCase()]
          ? texts[page.toLowerCase()].explanation
          : "TODO: No explanation found for this page."}
      </Typography>
    </Box>
  );
}
