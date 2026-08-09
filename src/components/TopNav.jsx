import { useState } from "react"
import { NavLink } from "react-router-dom"
import AppBar from "@mui/material/AppBar"
import Toolbar from "@mui/material/Toolbar"
import Button from "@mui/material/Button"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import MenuIcon from "@mui/icons-material/Menu"
import icon from "../assets/icon_large.png"

const pages = [
  ["Dashboard", "dashboard", null],
  ["Factor Packs", "factor-packs", 1],
  ["Options", "options", 2],
  ["Factors", "factors", 3],
  ["Fine Tune Weights", "weights", 4],
  ["Quiz", "quiz", 5],
  // I haven't used this in a while, I don't think it's that useful anymore
  // ["Overview", "decisions", 6],
  ["Results", "results", 6],
  // ['Import/Export', '/save', null],
  ["Explanation", "explanation", null],
]

const splitIndex = Math.ceil(pages.length / 2)
const pageRows = [pages.slice(0, splitIndex), pages.slice(splitIndex)]

export default function TopNav() {
  const [menuAnchor, setMenuAnchor] = useState(null)
  const menuOpen = Boolean(menuAnchor)

  const openMenu = (event) => {
    setMenuAnchor(event.currentTarget)
  }

  const closeMenu = () => {
    setMenuAnchor(null)
  }

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={1}
      sx={{
        bgcolor: "background.paper",
        width: { xs: "100%", md: "fit-content" },
        maxWidth: "100%",
        mx: "auto",
      }}>
      <Toolbar
        sx={{
          width: { xs: "100%", md: "auto" },
          minHeight: { xs: 72, md: 80 },
          alignItems: "center",
          justifyContent: "center",
          gap: { xs: 1, md: 2 },
          py: 1,
        }}>
        <IconButton
          component={NavLink}
          to="/"
          end
          aria-label="Factorie home"
          sx={{
            flex: "0 0 auto",
            width: { xs: 48, md: 56 },
            height: { xs: 48, md: 56 },
            borderRadius: 2,
            backgroundColor: "transparent",
            transition: "background-color 120ms ease",
            "&.active": {
              backgroundColor: "transparent",
            },
            "&:hover, &.active:hover": {
              backgroundColor: "action.hover",
            },
          }}>
          <Box
            component="img"
            src={icon}
            alt=""
            sx={{
              display: "block",
              width: { xs: 36, md: 42 },
              height: { xs: 36, md: 42 },
              objectFit: "contain",
            }}
          />
        </IconButton>

        <Box
          component="nav"
          aria-label="Primary navigation"
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            flex: "0 0 auto",
            alignItems: "center",
            gap: 0.75,
            minWidth: 0,
          }}>
          {pageRows.map((row, index) => (
            <Box
              key={index === 0 ? "primary-row" : "secondary-row"}
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 0.75,
                minWidth: 0,
              }}>
              {row.map(([label, path, order]) => (
                <Button
                  key={path}
                  component={NavLink}
                  to={`/${path}`}
                  color="inherit"
                  size="small"
                  sx={{
                    minWidth: 0,
                    px: { md: 0.9, lg: 1.15 },
                    fontSize: { md: "0.75rem", lg: "0.8rem" },
                    lineHeight: 1.2,
                    "&.active": {
                      backgroundColor: "action.hover",
                      fontWeight: 700,
                    },
                    whiteSpace: "nowrap",
                  }}>
                  {order}
                  {order && ". "}
                  {label}
                </Button>
              ))}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: { xs: "flex", md: "none" }, ml: "auto" }}>
          <IconButton
            aria-label="Open navigation menu"
            aria-controls={menuOpen ? "top-nav-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={menuOpen ? "true" : undefined}
            onClick={openMenu}
            color="inherit"
            edge="end">
            <MenuIcon />
          </IconButton>
          <Menu
            id="top-nav-menu"
            anchorEl={menuAnchor}
            open={menuOpen}
            onClose={closeMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}>
            {pages.map(([label, path, order]) => (
              <MenuItem
                key={path}
                component={NavLink}
                to={`/${path}`}
                onClick={closeMenu}
                sx={{
                  minWidth: 220,
                  "&.active": {
                    backgroundColor: "action.hover",
                    fontWeight: 700,
                  },
                }}>
                {order ? `${order}. ${label}` : label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
