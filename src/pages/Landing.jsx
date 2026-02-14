import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { useContext } from "react";
import ShowExplanationsContext from "../contexts/ShowExplanationsContext";
import { Checkbox } from "@mui/material";

export default function Landing() {
  const { showExplanations, setShowExplanations } = useContext(
    ShowExplanationsContext,
  );

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 5 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Factorie!
      </Typography>
      {/* <Typography variant="caption" gutterBottom>Make better decisions with factors and weights.</Typography> */}
      {/* make it italic */}
      <Typography variant="body1" paragraph sx={{ fontStyle: "italic" }}>
        A tool to help you decide what to do when it's complicated
      </Typography>
      <Typography variant="h5">Cool, I'm here. What is this?</Typography>
      <Typography variant="body2" paragraph>
        Factorie is a tool for helping you make better decisions, particularly
        big life decisions you want to think hard about and matter a lot. You
        outline all the options you have, and then list all the factors that
        might affect your decision. You then specify how much each those factor
        actually matters to you, and rate each option according to each factor.
        Factorie then combines all that information (using complicated, but not
        mysterious, math) to give you a recommendation for what to do based on
        the information you gave.
      </Typography>
      <Typography variant="h5">Where do I start?</Typography>
      <Typography variant="body2" paragraph>
        First, go to the <a href="dashboard">dashboard</a> page to create a new
        decision. Then you can go to the seperate pages for adding{" "}
        <a href="factors"> factors</a> and <a href="options">options</a>. Once
        done that, head over to the <a href="quiz">quiz</a> page, and it will
        guide you through inputting answers. If you're not quite sure what
        factors matter to you, head over to the <a href="weights">weights</a>{" "}
        page, and it will help you break it down.
      </Typography>
      <Typography variant="h5">
        This seems mysterious and hand wavy. How does it work?
      </Typography>
      <Typography variant="body2" paragraph>
        I'm glad you asked! The concept (if not the math) is actually pretty simple, and it's all
        explained in the <a href="explanations">explanations</a> page (with pictures, and without math).
      </Typography>
      <Typography variant="h5">
        I'm not totally sold... why would I let a "computer" make major life
        decisions for me?
      </Typography>
      <Typography variant="body2" paragraph>
        You're not! Think of this as just a calculator, or a structured pro-con
        list. You're the one inputting all the information, and you're the one
        who can change it at any time. The computer is just doing some basic
        math to combine all the information you gave it in a way that's more
        accurate than your brain can do on its own. It's not making the decision
        for you, it's just giving you a recommendation based on the information
        you provided.
      </Typography>
      {/* <Typography variant="h5">I'm still confused...</Typography>
      <Typography variant="body2" paragraph>
        Think of it as a pro-con list, but more accurate, and with more graphs.
      </Typography> */}
      <Typography variant="h5">
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
      <Checkbox
        checked={showExplanations}
        onChange={(e) => setShowExplanations(e.target.checked)}
      />
      Show explanations
    </Box>
  );
}
