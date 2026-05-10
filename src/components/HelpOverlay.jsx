import React, { useState } from "react";
import { Box, Tooltip, IconButton } from "@mui/material";
// import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

export default function HelpOverlay({ children, helpText }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      position="relative"
      display="inline-block"
    //   alignSelf="flex-start"
    // sx={{alignSelf:"flex-start"}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >


      {hovered && (
        <Tooltip title={helpText} arrow>
          <IconButton
            size="medium"
            sx={{
              position: "absolute",
              zIndex: 9999,
              // TODO: this broke? This is a hack, for now
              right: '10%',
              // top: 4,
              // right: 4,
            //   color: "grey.400",
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
    </div>
  );
}
