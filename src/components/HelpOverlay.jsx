import React, { useState } from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
// import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

export default function HelpOverlay({ children, helpText }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      sx={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <Tooltip title={helpText} arrow>
          <IconButton
            size="medium"
            sx={{
              position: "absolute",
              top: "1rem",
              right: "1rem",
              zIndex: 99,
              backgroundColor: "rgba(255,255,255,0.6)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.95)",
              },
            }}
          >
            <HelpOutlineOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
      {children}
    </Box>
  );
}
