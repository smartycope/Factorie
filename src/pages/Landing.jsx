import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import { useContext } from "react"
import ShowExplanationsContext from "../contexts/ShowExplanationsContext"
import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import Accordion from "@mui/material/Accordion"
import AccordionSummary from "@mui/material/AccordionSummary"
import AccordionDetails from "@mui/material/AccordionDetails"
import Link from "@mui/material/Link"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { Link as RouterLink } from "react-router-dom"

const faqAccordionSx = {
  boxShadow: "none",
  borderTop: "1px solid",
  borderColor: "divider",
  "&:before": {
    display: "none",
  },
}

export default function Landing() {
  const { showExplanations, setShowExplanations } = useContext(
    ShowExplanationsContext,
  )
  const faqItems = [
    {
      question: "Cool, I'm here. What is this?",
      answer: (
        <Typography variant="body2" paragraph>
          Factorie is a tool for helping you make big life decisions. You use it
          kinda like a pro-con list: you specify what options you have, then
          list all the factors that might affect your decision. Then you specify
          how much each those factors actually matters to you, and rate each
          option according to each factor. Factorie then combines all that
          information (using complicated, but not mysterious, math) to help
          inform you objectively on each option about each option, and explain
          how it came to that answer based on the information you gave.
        </Typography>
      ),
    },
    {
      question: "Where do I start?",
      answer: (
        <Typography variant="body2" paragraph>
          First, go to the{" "}
          <Link component={RouterLink} to="/dashboard">
            dashboard
          </Link>{" "}
          page to create a new decision. Then you can go to the seperate pages
          for adding{" "}
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
            fine tune weights
          </Link>{" "}
          page, and it will help you break it down.
        </Typography>
      ),
    },
    {
      question: "This seems mysterious and hand wavy. How does it work?",
      answer: (
        <Typography variant="body2" paragraph>
          I'm glad you asked! The concept is actually pretty simple, and it's
          all explained in the{" "}
          <Link component={RouterLink} to="/explanation">
            explanation
          </Link>{" "}
          page (with pictures and without equations).
        </Typography>
      ),
    },
    {
      question:
        'I\'m not totally sold... why would I let a "computer" make major life decisions for me?',
      answer: (
        <Typography variant="body2" paragraph>
          You're not! Think of this as a calculator, or a structured
          pro-con list. You're the one inputting all the information, and you
          can change it at any time. The computer is just doing some math to
          combine all the information you gave it in a way that's more accurate
          than your brain can do on its own. It's not making the decision for
          you, it's just giving you a recommendation based on the information
          you provided.
        </Typography>
      ),
    },
    {
      question: "How long does it take?",
      answer: (
        <Typography variant="body2" paragraph>
          As you might expect, it depends on how big the decision is. For a big
          decision like buying a house or deciding who to marry, there's a lot
          of factors that go into that decision so it could take up to several
          hours. There's a reason it only makes sense to use this for big life
          decisions.
        </Typography>
      ),
    },
    {
      question: (
        <>
          Well I'm not making a decision <i>today</i>
        </>
      ),
      answer: (
        <Typography variant="body2" paragraph>
          That's fine! Decisions will be saved in this browser, and you can also
          download your progress and import it again later. If you're thinking
          lots about a particular life decision, it's helpful to lay out all the
          things that could relate to it (factors) and decide what you want
          (weight them) before you have options, so you can evaluate your
          options objectively when they do come. Taking off the rose-colored
          glasses, and all that.
          <br /> Additionally, you can use it as a "to do list" for things to
          look into. If you lay out a bunch of factors, and then realize you
          don't know exactly what you <i>want</i> them to be, that tells you
          what you need to introspect about.
        </Typography>
      ),
    },
    {
      question: "Does it use AI?",
      answer: (
        <Typography variant="body2" paragraph>
          Nope! And that's a good thing. It's entirely* deterministic, so the
          answers are consistent and based only on the information you give it.
          It will explain why it gave you the answer it did, and it won't
          hallucinate a random answer.
          <br />
          <br />* The only part that isn't deterministic is the simulation of
          the uncertain values (ranges). It calculates the best answer using
          random values within each range{' '}
          {/* Validate this number */}
          ~1000x, and then averages the results. So it's not technically
          deterministic, but it shouldn't impact the decision too much.
        </Typography>
      ),
    },
    {
      question: "I found a thing that doesn't work!",
      answer: (
        <Typography variant="body2" paragraph>
          Awesome! Please either let Cope know, or submit an issue yourself <a href="https://github.com/smartycope/factorie/issues">here</a>.
        </Typography>
      ),
    },
  ]

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 1, mb: 0 }}>
      <Typography variant="h3" component="h1" sx={{ mb: 0.25 }}>
        Welcome to Factorie!
      </Typography>
      <Typography
        variant="caption"
        paragraph
        sx={{ fontStyle: "italic", mb: 1, color: "text.secondary" }}>
        {/* A tool to help you decide what to do when it's complicated */}
        Helping you live a more examined life
      </Typography>
      <br />
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
      <Typography variant="h4" component="h2" sx={{ mt: 2, mb: 1 }}>
        FAQ
      </Typography>
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
        {faqItems.map((item, index) => (
          <Accordion key={index} disableGutters sx={faqAccordionSx}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5" component="h3">
                {item.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>{item.answer}</AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  )
}
