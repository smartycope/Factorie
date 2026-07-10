import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useContext } from "react";
import ShowExplanationsContext from "../contexts/ShowExplanationsContext";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import { Link as RouterLink } from "react-router-dom";

const sectionHeadingSx = {
  mt: 4,
  mb: 1,
};

export default function Landing() {
  const { showExplanations, setShowExplanations } = useContext(
    ShowExplanationsContext,
  );

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 1, mb: 0 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 0.25 }}>
        Welcome to Factorie!
      </Typography>
      {/* <Typography variant="caption" gutterBottom>Make better decisions with factors and weights.</Typography> */}
      {/* make it italic */}
      <Typography
        variant="caption"
        paragraph
        sx={{ fontStyle: "italic", mb: 1, color: "text.secondary" }}
      >
        {/* A tool to help you decide what to do when it's complicated */}
        Helping you live a more examined life
      </Typography>
      <br/>
      <FormControlLabel
        sx={{ mb: 2 }}
        control={
          <Checkbox
            checked={showExplanations}
            onChange={(e) => setShowExplanations(e.target.checked)}
          />
        }
        label="Show explanations"
      />
      <Typography variant="h5" sx={sectionHeadingSx}>
        Cool, I'm here. What is this?
      </Typography>
      <Typography variant="body2" paragraph>
        Factorie is a tool for helping you make big life decisions. You use it
        kinda like a pro-con list: you specify what options you have, then list
        all the factors that might affect your decision. Then you specify how
        much each those factors actually matters to you, and rate each option
        according to each factor. Factorie then combines all that information
        (using complicated, but not mysterious, math) to help inform you
        objectively on each option about each option, and explain how it came to
        that answer based on the information you gave.
      </Typography>
      <Typography variant="h5" sx={sectionHeadingSx}>
        Where do I start?
      </Typography>
      <Typography variant="body2" paragraph>
        First, go to the{" "}
        <Link component={RouterLink} to="/dashboard">
          dashboard
        </Link>{" "}
        page to create a new decision. Then you can go to the seperate pages for
        adding{" "}
        <Link component={RouterLink} to="/factors">
          factors
        </Link>{" "}
        and{" "}
        <Link component={RouterLink} to="/options">
          options
        </Link>
        . Once done that, head over to the{" "}
        <Link component={RouterLink} to="/quiz">
          quiz
        </Link>{" "}
        page, and it will guide you through inputting answers. If you're not
        quite sure what factors matter to you, head over to the{" "}
        <Link component={RouterLink} to="/weights">
          weights
        </Link>{" "}
        page, and it will help you break it down.
      </Typography>
      <Typography variant="h5" sx={sectionHeadingSx}>
        This seems mysterious and hand wavy. How does it work?
      </Typography>
      <Typography variant="body2" paragraph>
        I'm glad you asked! The concept is actually pretty
        simple, and it's all explained in the{" "}
        <Link component={RouterLink} to="/explanation">
          explanation
        </Link>{" "}
        page (with pictures and without equations).
      </Typography>
      <Typography variant="h5" sx={sectionHeadingSx}>
        I'm not totally sold... why would I let a "computer" make major life
        decisions for me?
      </Typography>
      <Typography variant="body2" paragraph>
        You're not! Think of this as just a calculator, or a structured pro-con
        list. You're the one inputting all the information, and you're the one
        who can change it at any time. The computer is just doing some
        math to combine all the information you gave it in a way that's more
        accurate than your brain can do on its own. It's not making the decision
        for you, it's just giving you a recommendation based on the information
        you provided.
      </Typography>
      {/* <Typography variant="h5">I'm still confused...</Typography>
      <Typography variant="body2" paragraph>
        Think of it as a pro-con list, but more accurate, and with more graphs.
      </Typography> */}
      <Typography variant="h5" sx={sectionHeadingSx}>
        Well I'm not making a decision <i>today</i>
      </Typography>
      <Typography variant="body2" paragraph>
        That's fine! Decisions will be saved in this browser, but you can also
        download decisions as a file, and then re upload them later. This will
        hopefully get you to consider things you haven't thought of yet, so it's
        very likely you'll have to do some more research and come back to get a
        good answer.
      </Typography>
      {/* <Typography variant="body2" paragraph>
        To start, go to the <a href="decisions">decisions</a> page to create a
        new decision.
      </Typography> */}
    </Box>
  );
}
