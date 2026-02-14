import React, { useState } from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

export default function HelpOverlay({ children, helpText }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      position="relative"
      display="inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}

      {hovered && (
        <Tooltip title={helpText} arrow>
          <IconButton
            size="medium"
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
            //   color: "grey.400",
              backgroundColor: "rgba(255,255,255,0.6)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.95)",
              },
            }}
          >
            <HelpOutlineIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
