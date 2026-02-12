import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import {useContext} from 'react';
import ShowExplanationsContext from '../contexts/ShowExplanationsContext';
import {Checkbox} from '@mui/material';

export default function Landing() {
  const {showExplanations, setShowExplanations} = useContext(ShowExplanationsContext)

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Factorie
      </Typography>
      {/* <Typography variant="caption" gutterBottom>Make better decisions with factors and weights.</Typography> */}
      {/* make it italic */}
      <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
        Helping you live a more examined life
      </Typography>
      <Typography variant="body2" paragraph>
        Use the navigation to open pages and start creating decisions, or, if
        you're not totally sold on letting a "computer" make your life decisions
        for you, head over the the <a href="/explanation">explanation</a> page
        and learn exactly how it works (with images!).
      </Typography>
      <Typography variant="body2" paragraph>
        Factorie is a tool for helping you make better decisions. It does this
        by letting you break down your decisions into factors, and then
        weighting those factors to see which option comes out on top. It's
        similar to a decision matrix, but more accurate and flexible. It also
        forces you to think about the decision critically, and help you consider
        things that you haven't yet considered.
      </Typography>
      <Typography variant="body2" paragraph>
        In terms of saving, the decisions will be saved in this browser, but you
        can also download decisions as a file, and then re upload them later.
        You can also email them to yourself so you don't lose them.
      </Typography>
      <Typography variant="body2" paragraph>
        To start, go to the <a href="/decisions">decisions</a> page to create a
        new decision. You can add numbers directly there, but if it's too
        intimidating, you can just add <a href="/factors"> factors</a> and{" "}
        <a href="/options">options</a> seperately, and then go to the{" "}
        <a href="/quiz">quiz</a> page, and it will guide you through inputting
        answers.
      </Typography>
      <Checkbox
        checked={showExplanations}
        onChange={(e) => setShowExplanations(e.target.checked)}
      />
      Show explanations
    </Box>
  );
}
