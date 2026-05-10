import { NavLink } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import {Stack} from '@mui/material';

const pages = [
  ['Dashboard', 'dashboard', null],
  ['Options', 'options', 1],
  ['Factor Packs', 'factor-packs', 2],
  ['Factors', 'factors', 3],
  ['Fine Tune Weights', 'weights', 4],
  ['Quiz', 'quiz', 5],
  ['Decision', 'decisions', 6],
  ['Results', 'results', 7],
//   ['Import/Export', '/save', null],
  ['Explanation', 'explanation', null],
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
          {pages.map(([label, path, order]) => (
            // <Stack key={path+"label"} direction="column" spacing={0}>
            // {order && <Typography
            //   key={path + "order"}
            // //   component={NavLink}
            //   to={path}
            //   color="inherit"
            //   size="small"
            // >
            //   {order}.
            // </Typography>}
            <Button
              key={path}
              component={NavLink}
              to={path}
              color="inherit"
              size="small"
              sx={{
                "&.active": {
                  backgroundColor: "action.hover",
                },
                // Keep it on one line
                whiteSpace: "nowrap",
              }}
            >
              {order}{order && ". "}{label}
              {/* {label} */}
            </Button>
            // </Stack>
          ))}
        </Box>

        {/* <Box sx={{ ml: 'auto' }}>
          <Button component={NavLink} to="/" color="primary" variant="outlined" size="small">Home</Button>
        </Box> */}
      </Toolbar>
    </AppBar>
  );
}
