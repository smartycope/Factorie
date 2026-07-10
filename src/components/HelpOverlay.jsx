import { useState } from "react";
import { Box, Tooltip, Icon } from "@mui/material";
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';

export default function HelpOverlay({ children, helpText, left, rightAmt}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      sx={{ position: "relative", display: "inline-block", width:'100%', height: '100%'}}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <Tooltip title={helpText} arrow>
          <Icon
            size="medium"
            sx={{
                color: '#0f0f0f66',
              position: "absolute",
              top: "min(2%, 1rem)",
              right: rightAmt ? rightAmt : (left ? "98%" : "min(2%, 1rem)"),
              zIndex: 99,
              backgroundColor: "rgba(255,255,255,0.6)",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.95)",
              },
            }}
          >
            <HelpOutlineOutlinedIcon fontSize="inherit" />
          </Icon>
        </Tooltip>
      )}
      {children}
    </Box>
  );
}
