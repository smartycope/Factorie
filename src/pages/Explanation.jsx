import { useEffect } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import graph1 from "../assets/graph1.png"
import graph2 from "../assets/graph2.png"
import graph3 from "../assets/graph3.png"
import graph4 from "../assets/graph4.png"
import graph5 from "../assets/graph5.png"
import graph6 from "../assets/graph6.png"
import graph7 from "../assets/graph7.png"
import graph8 from "../assets/graph8.png"
import "katex/dist/katex.min.css"
import Latex from "react-latex-next"

const sections = [
  { id: "how-it-works", label: "How it works" },
  {
    id: "interpreting-a-single-option",
    label: "Interpreting a single option",
  },
  { id: "good-practices", label: "Best Practices" },
  { id: "the-math", label: "The Math" },
]

const formulaSx = {
  maxWidth: 760,
  mx: "auto",
  my: 2,
  px: 2,
  py: 1.5,
  overflowX: "auto",
  borderRadius: 1,
  bgcolor: "action.hover",
  fontFamily: "monospace",
  fontSize: "1rem",
  textAlign: "center",
  whiteSpace: "nowrap",
}

function scrollToSection(id, behavior = "smooth") {
  const section = document.getElementById(id)
  if (!section) return

  section.scrollIntoView({ behavior, block: "start" })
}

export default function Explanation() {
  useEffect(() => {
    const hashTarget = window.location.hash.split("#").at(-1)
    if (sections.some((section) => section.id === hashTarget)) {
      window.requestAnimationFrame(() => scrollToSection(hashTarget, "auto"))
    }
  }, [])

  const handleSectionClick = (event, sectionId) => {
    event.preventDefault()
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#/explanation#${sectionId}`,
    )
    scrollToSection(sectionId)
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box
        component="nav"
        aria-label="On this page"
        sx={{
          mb: 4,
          textAlign: "center",
        }}>
        <Typography
          variant="overline"
          component="h2"
          sx={{ color: "text.secondary", letterSpacing: 0, fontWeight: 700 }}>
          On this page
        </Typography>
        <Box
          component="ul"
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 2.5,
            mt: 1,
            mb: 0,
            p: 0,
            listStyle: "none",
          }}>
          {sections.map((section) => (
            <Box component="li" key={section.id}>
              <Box
                component="a"
                href={`#/explanation#${section.id}`}
                onClick={(event) => handleSectionClick(event, section.id)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: "primary.main",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textDecorationColor: "transparent",
                  textUnderlineOffset: "0.25em",
                  transition:
                    "color 120ms ease, text-decoration-color 120ms ease",
                  "&:hover, &:focus-visible": {
                    outline: "none",
                    color: "primary.dark",
                    textDecorationColor: "currentColor",
                  },
                }}>
                {section.label}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Typography variant="h5" gutterBottom id="how-it-works">
        How it works
      </Typography>
      <Typography>
        When making a big decision, it's important to consider all the factors,
        however it's also important to be confident in the process by which you
        make the decision. This program is a tool to help you make decisions,
        but its also important that you understand how it works so you can be
        confident in the answer it gives. Accordingly, here's an explanation of
        how it works. In addition, if you want a deeper understanding of how it
        works, feel free to{" "}
        <a href="https://github.com/smartycope/factorie">read the code</a> and
        understand how it works on a deeper level.
      </Typography>

      <Typography>
        The algorithm is based on a fairly simple idea: you want to make the
        choice that is closest to the best option you have. Say you're trying to
        decide what to have for dinner, and you only care about 2 things: taste
        and cost. You have a number of options, and you're trying to decide
        which one to make. You can intuit that the best option will balance
        taste and cost.
      </Typography>

      <Typography>
        Imagine a graph, where the x axis is taste and the y axis is cost. Each
        option is a point on the graph:
      </Typography>

      <img src={graph1} alt="Scatter plot example" />

      <Typography>
        You sit down and think about it, and you give tacos a 8/10 in taste, and
        they cost $10. Spaghetti costs $6, and you give it an 4/10 in taste.
        <br />
        <br />
        Which one is better? Spaghetti or Tacos? You like tacos more, but
        spaghetti is cheaper. <br />
        <br />
        Well now you can imagine your "perfect" meal. Everything you want in a
        single meal, even if it's impossible. You can't make it, but it's the
        best meal you can think of. Where would it be? The perfect meal would
        taste 10/10, and cost nothing, right?
      </Typography>

      <img src={graph2} alt="Scatter plot example" />

      <Typography>
        Now, the answer seems pretty clear. Just pick the option closest to the
        perfect meal, right?
      </Typography>
      <img src={graph3} alt="Scatter plot example" />

      <Typography>
        Spaghetti is closer to being the perfect meal, so it's better! The cost
        outweighs the taste. <br />
        <br />
        However, there's one thing we're assuming here. We're assuming we care
        about taste and cost the same amount. What if your paycheck just came
        in? In that case you might care less about the cost, but it does still
        matter. <br />
        <br />
        To take this into account, we have a "weight" value, describing "how
        much do I care?" for each factor. You can think of this as "squishing"
        the axis of the graph.
      </Typography>

      <img src={graph4} alt="Scatter plot example" />

      <Typography>
        And there you have it! The tacos are now closer to the perfect meal.
        This makes sense: if you care less about money, you're more likely to
        pick the meal that tastes better. <br />
        <br />
        Behind the scenes, each factor is first converted to a scale from 0 to 1
        using its minimum and maximum. That keeps units like dollars, minutes,
        and 0–10 ratings comparable. The algorithm then scales each normalized
        axis by its weight and uses ordinary straight-line distance. Multiplying
        every weight by the same amount does not change the ranking; only their
        proportions matter. If a minimum or maximum is calculated from the
        answers instead of set explicitly, that axis is relative to the current
        options. Adding a new extreme option can then rescale that factor, so
        explicit realistic bounds give the most stable comparisons.
        <br />
        <br />
        That's all there is to it! Of course, this is a very simple example. In
        real life, you likely have more factors, especially in big decisions.
        For example, you might care about the healthiness of the meal, or the
        time it takes to make it, or the amount of leftovers it leaves. <br />
        <br />
        To add more factors, you simply add more dimensions:
      </Typography>

      <img src={graph5} alt="Scatter plot example" />
      <Typography>
        Of course, this gets hard to visualize, but that math still works. It's
        exactly the same principal. You can add as many factors as you want, and
        the still calculate the distance between the options and the perfect
        option, even if it's hard to graph.
      </Typography>
      <br />
      <hr />
      <br />
      <Typography variant="h5" id="interpreting-a-single-option">
        Interpreting a single option
      </Typography>
      <Typography>
        Now consider the situation where you only have one option, and you're
        trying to decide if it's good enough. What does "good enough" mean?{" "}
        <br />
        <br />
        For example, say you're dating someone, and it's going pretty well, and
        you're trying to decide if you should marry them or not. You could put
        in your 2 options, "marry them" and "don't marry them", and then try to
        decide between them. But it can be hard to imagine what your life is
        like without them. So you essentially have 1 option that you're trying
        to decide if it's good enough. What do you do?
        <br />
        <br /> Well, let's adding some factors which relate to relationships,
        and try plotting it for starters:
      </Typography>
      <img src={graph6} alt="Scatter plot example" />
      <Typography>
        Ya, you enjoy spending time with them, but they also don't love you that
        much. But what if that's the best you could expect? Marrying someone is
        a big decision! We need some way of deciding if an option is "good
        enough". <br />
        <br />
        One way to do that is to calculate what the "worst" option is, and
        compare your option on a scale from the worst possible option to the
        best possible option.
      </Typography>
      <img src={graph7} alt="Scatter plot example" />
      <Typography>
        Yikes! They're not even 50% good! Maybe you shouldn't marry them... they
        don't seem that great after all. <br />
        <br />
        If we establish a threshold, especially before we evaluate a given
        partner, we can require that they pass that threshold. This could keep
        us from marrying someone we think we really like, but isn't actually
        that great.
      </Typography>
      <img src={graph8} alt="Scatter plot example" />
      <Typography>
        This threshold quantifies how "picky" you are. People tend to start off
        picky, and then get less picky over time. If you want a different
        algorithm for tuning this threshold, check out the first 2 chapters of
        the book "Algorithms to Live By" by Brian Christian and Tom Griffiths.
      </Typography>
      <br />
      <hr />
      <br />
      <Typography variant="h5" gutterBottom id="good-practices">
        Best Practices
      </Typography>
      <Box
        component="ul"
        sx={{
          maxWidth: 760,
          mx: "auto",
          px: 2,
          listStylePosition: "inside",
          textAlign: "center",
          "& li": {
            mb: 1.5,
          },
        }}>
        <li>
          If you get an answer, and you go, "what? That's not right!", you're
          probably right. This program generally tells you what you already
          know. It's supposed to help you break a decision down to make it
          easier to analyze. If you're surprised, you might need to add more
          factors. For example, if you got the answer "make chicken noodle
          soup", and go "ugh, but that's so much effort!", maybe you need to add
          an "effort" factor, or maybe the "effort" factor is weighted too low.
          (Unless you intentionally weighted it low because you don't want to
          care about the effort, in which case it's telling you you're being
          lazy.)
        </li>
        <li>
          Don't forget that you can quantify your emotions here. Emotions are
          often a valid part of any major decision. Try adding factors like
          "happiness" or "How much I want to"
        </li>
        <li>
          Factors can be almost anything. Emotions, person preference, objective
          measurements, literally anything that is relevant to the decision. The
          more factors, the more accurate your answer will be.
        </li>
        <li>
          "Garbage in, Garbage out". You can certainly throw some values in to
          see how it looks. But keep in mind that it won't necessarily be a very
          accurate answer. If you're making a big decision, really think about
          the values you put in.
        </li>
        <li>
          Don't care about everything. Usually, all the factors aren't equally
          relevant. The weights can have a large impact on the result, be sure
          you choose them carefully. I've included a whole page just for fine
          tuning how much you care about each factor.
        </li>
        <li>
          This is self-reported. For best results, try to set the weights and
          threshold objectively: either before you have to make the decision,
          going over them with a friend. If you want to Gerrymander the weights
          to get the decision you want, you probably can. Don't do that.
        </li>
        <li>
          Factors work best when they describe unique concepts. They should be
          mutually exclusive as much as possible. For example, if you're
          deciding what to eat, and as factors you put both "does it taste good"
          and "is it flavorful", and weight them the same and give the same
          answers, it's essentially going to bias the result as if you weighted
          it double what you actually weighted it as (even if that's more than
          10). However, you can get very specific: if you have both "does it
          have lots of flavor" and "does it have good texture", and you (at
          least potentially) give different weights and values for those, then
          those are both valid factors.
        </li>
        <li>
          This app is able to handle as many factors as you can think of. I've
          tested it up to 200 so far.
        </li>
        <li>
          Don't be afraid to go back and tweak your factors while you're making
          the decision. Frequently, as you're adding answers, you'll think of
          new factors. When you get the initial results, you'll likely go "wait,
          really? Do I really care about that that much?". That's a sign you
          need to go fine tune your weights.
        </li>
      </Box>
      <br />
      <hr />
      <br />
      <Typography variant="h5" gutterBottom id="the-math">
        The Math
      </Typography>
      <Typography>
        The graphs above show the basic idea geometrically. This section writes
        out the same process more precisely. The subscripts identify which
        option and factor a value belongs to: <strong>i</strong> means an
        option, and <strong>j</strong> means a factor.
      </Typography>

      <Typography variant="h6" gutterBottom>
        1. Normalize every factor
      </Typography>
      <Typography>
        Dollars, minutes, and 0–10 ratings cannot be compared directly. Each
        answer is first converted to a position on a common scale from 0 to 1:
      </Typography>
      <Latex>{`\\[
        x_{ij}=\\frac{a_{ij}-\\min_j}{\\max_j-\\min_j}
        \\]`}</Latex>
      <Box component="ul" sx={{ maxWidth: 760, mx: "auto", textAlign: "left" }}>
        <li>
          <strong>aᵢⱼ</strong> is option i's original answer for factor j.
        </li>
        <li>
          <strong>minⱼ</strong> and <strong>maxⱼ</strong> are factor j's
          effective bounds.
        </li>
        <li>
          <strong>xᵢⱼ</strong> is the resulting normalized answer. Zero is the
          lower bound and one is the upper bound.
        </li>
      </Box>
      <Typography>
        The factor's optimal value is normalized in exactly the same way and is
        called <strong>oⱼ</strong>. A constant factor whose minimum and maximum
        are equal cannot distinguish between options, so it contributes no
        distance (but that's a bit of a silly case, that factor might as well
        not exist).
      </Typography>

      <Typography variant="h6" gutterBottom>
        2. Measure weighted distance from the optimum
      </Typography>
      <Typography>
        For each factor, the algorithm subtracts the normalized optimum from the
        normalized answer, then scales that difference by the factor's weight.
        It combines those weighted differences using ordinary Euclidean
        distance:
      </Typography>
      <Latex>{`\\[d_i=\\sqrt{\\sum_{j=1}^{n}\\left[w_j(x_{ij}-o_j)\\right]^2}\\]`}</Latex>
      <Box component="ul" sx={{ maxWidth: 760, mx: "auto", textAlign: "left" }}>
        <li>
          <strong>wⱼ</strong> is the weight assigned to factor j.
        </li>
        <li>
          <strong>xᵢⱼ − oⱼ</strong> is option i's normalized deviation from the
          desired value on factor j.
        </li>
        <li>
          <strong>Σⱼ</strong> means to add the squared weighted deviations for
          every factor.
        </li>
        <li>
          <strong>dᵢ</strong> is option i's total weighted distance from the
          optimal point. A smaller distance is better.
        </li>
      </Box>
      <Typography>
        This is the mathematical version of squishing each axis by its weight.
        Multiplying every weight by the same amount scales all raw distances
        equally, so only the proportions between weights affect the final
        ranking.
      </Typography>

      <Typography variant="h6" gutterBottom>
        3. Find the worst possible distance
      </Typography>
      <Typography>
        To turn distance into an understandable 0–100% score, the algorithm
        finds the farthest feasible endpoint from the optimum on each normalized
        factor:
      </Typography>
      <Latex>{`\\[m_j=\\max(|o_j|,|1-o_j|)\\]`}</Latex>
      <Typography>
        Here, <strong>mⱼ</strong> is factor j's greatest possible normalized
        deviation. Combining those worst deviations with the same weights gives
        the farthest possible overall distance:
      </Typography>
      <Latex>{`\\[D_{\\max}=\\sqrt{\\sum_{j=1}^{n}(w_jm_j)^2}\\]`}</Latex>
      <Typography>
        <strong>Dₘₐₓ</strong> is the distance from the optimal point to the
        farthest feasible corner of the multidimensional space.
      </Typography>

      <Typography variant="h6" gutterBottom>
        4. Convert distance into goodness
      </Typography>
      <Typography>
        Finally, each option's distance is compared with that worst possible
        distance:
      </Typography>
      <Latex>{`\\[
        \\text{badness}_i=\\frac{d_i}{D_{\\max}},
        \\qquad
        \\text{goodness}_i=1-\\text{badness}_i
        \\]`}</Latex>
      <Typography>
        An option at the optimal point has 0% badness and 100% goodness. An
        option at the farthest feasible point has 100% badness and 0% goodness.
        Best and worst are simply the options with the smallest and largest
        weighted distances, respectively. Likewise, the point exactly in between
        the best and worst, the "average" option, has 50% badness and 50%
        goodness.
      </Typography>

      <Typography variant="h6" gutterBottom>
        Uncertain answers
      </Typography>
      <Typography>
        When an answer is a range, deterministic modes can use its best, worst,
        high, low, average, or middle value. Monte Carlo mode instead draws
        values uniformly from inside every range, performs the complete
        calculation repeatedly, and reports the mean and standard deviation of
        the results. Its ranking therefore reflects average distance from the
        optimum across those simulated possibilities.
      </Typography>
    </Box>
  )
}
