import { NavLink } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

const pages = [
  ['Dashboard', '/dashboard'],
  ['Decision', '/decisions'],
  ['Options', '/options'],
  ['Factors', '/factors'],
  ['Quiz', '/quiz'],
  ['Fine Tune Weights', '/weights'],
  ['Results', '/results'],
//   ['Factor Packs', '/factor-packs'],
//   ['Import/Export', '/save'],
  ['Explanation', '/explanation'],
]

export default function TopNav() {
  return (
    <AppBar position="static" color="transparent" elevation={1}>
      <Toolbar sx={{ maxWidth: 1200, margin: "0 auto", width: "100%"}}>
        {/* Keep it vertical */}
        <Button
          component={NavLink}
          to="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexDirection: "column",
            maxWidth: 150,
            // padding: 0,
            // fontSize: ".75rem",
          }}
        >
          <Typography variant="h5" component="div">
            Factorie
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1, fontSize: "0.625rem" }}
          >
            Helping you live a more examined life
          </Typography>
        </Button>

        <Box
          component="nav"
          sx={{ ml: 3, display: { xs: "none", md: "flex" }, gap: { xs: 0, md: 2 } }}
        >
          {pages.map(([label, path]) => (
            <Button
              key={path}
              component={NavLink}
              to={path}
              color="inherit"
              size="small"
            >
              {label}
            </Button>
          ))}
        </Box>

        {/* <Box sx={{ ml: 'auto' }}>
          <Button component={NavLink} to="/" color="primary" variant="outlined" size="small">Home</Button>
        </Box> */}
      </Toolbar>
    </AppBar>
  );
}
