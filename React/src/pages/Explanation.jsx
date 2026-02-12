// TODO: this page is incomplete. Copy texts over manually

import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
// const Plot = React.lazy(() => import('react-plotly.js'))
import graph1 from '../assets/graph1.png'
import graph2 from '../assets/graph2.png'
import graph3 from '../assets/graph3.png'
import graph4 from '../assets/graph4.png'
import graph5 from '../assets/graph5.png'
import graph6 from '../assets/graph6.png'
import graph7 from '../assets/graph7.png'
import graph8 from '../assets/graph8.png'

export default function Explanation() {
  // Distances for the first example
//   const tacos = { x: 8, y: 10 }
//   const spaghetti = { x: 4, y: 6 }
//   const perfect = { x: 10, y: 0 }
//   const dist = (a, b, weightY = 1) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow((a.y - b.y) * weightY, 2))


//   const scatter2d = {
//     data: [
//       { x: [tacos.x, spaghetti.x], y: [tacos.y, spaghetti.y], mode: 'markers+text', text: ['Tacos', 'Spaghetti'], textposition: 'top center', marker: { size: 10 } },
//       { x: [perfect.x], y: [perfect.y], mode: 'markers+text', text: ['Perfect Meal'], textposition: 'bottom right', marker: { size: 10 } },
//       { x: [tacos.x, perfect.x], y: [tacos.y, perfect.y], mode: 'lines', line: { color: 'green' }, hoverinfo: 'none' },
//       { x: [spaghetti.x, perfect.x], y: [spaghetti.y, perfect.y], mode: 'lines', line: { color: 'green' }, hoverinfo: 'none' },
//     ],
//     layout: {
//       title: 'What should I eat for dinner?',
//       xaxis: { title: 'Taste', range: [0, 11], tickmode: 'array', tickvals: [0,2,4,6,8,10], ticktext: ['0/10','2/10','4/10','6/10','8/10','10/10'], showgrid: false, zeroline: false },
//       yaxis: { title: 'Cost', range: [0, 11], tickmode: 'array', tickvals: [0,2,4,6,8,10], ticktext: ['$0','$2','$4','$6','$8','$10'], showgrid: false, zeroline: false },
//       showlegend: false,
//       width: 640,
//       height: 480,
//     }
//   }

//   const weightedD = {
//     data: [
//       { x: [tacos.x, spaghetti.x], y: [tacos.y * 0.5, spaghetti.y * 0.5], mode: 'markers+text', text: ['Tacos', 'Spaghetti'], textposition: 'top center', marker: { size: 10 } },
//       { x: [perfect.x], y: [perfect.y * 0.5], mode: 'markers+text', text: ['Perfect Meal'], textposition: 'bottom right', marker: { size: 10 } },
//       { x: [tacos.x, perfect.x], y: [tacos.y * 0.5, perfect.y * 0.5], mode: 'lines', line: { color: 'green' } },
//       { x: [spaghetti.x, perfect.x], y: [spaghetti.y * 0.5, perfect.y * 0.5], mode: 'lines', line: { color: 'green' } },
//     ],
//     layout: {
//       title: 'Weighted example (taste 100%, cost 50%)',
//       xaxis: { title: 'Taste - 100% weight', range: [0, 11], tickmode: 'array', tickvals: [0,2,4,6,8,10] },
//       yaxis: { title: 'Cost - 50% weight', range: [0, 11], tickmode: 'array', tickvals: [0,2,4,6,8,10] },
//       width: 640,
//       height: 480,
//       showlegend: false,
//     }
//   }

//   // 3D example
//   const scatter3d = {
//     data: [
//       { x: [8,4], y: [10,6], z: [4,8], mode: 'markers+text', text: ['Tacos','Spaghetti'], textposition: 'top center', marker: { size: 4 } },
//       { x: [10], y: [0], z: [10], mode: 'markers+text', text: ['Perfect Meal'], textposition: 'bottom right', marker: { size: 4 } },
//       { x: [8,10], y: [10,0], z: [4,10], mode: 'lines', line: { color: 'green' } },
//       { x: [4,10], y: [6,0], z: [8,10], mode: 'lines', line: { color: 'green' } },
//     ],
//     layout: {
//       title: '3D: Taste vs Cost vs Healthiness',
//       scene: { xaxis: { title: 'Taste (0-10)' }, yaxis: { title: 'Cost ($)' }, zaxis: { title: 'Healthiness (0-10)' } },
//       width: 700,
//       height: 500,
//     }
//   }

//   // Single-option interpretation distances
//   const partner = { x: 2, y: 6 }
//   const perfectPartner = { x: 10, y: 10 }
//   const worst = { x: 0, y: 0 }
//   const marriedDist = dist(partner, perfectPartner)
//   const worstDist = dist(worst, perfectPartner)

//   const partner2d = {
//     data: [
//       { x: [partner.x], y: [partner.y], mode: 'markers+text', text: ['Your partner'], textposition: 'top center', marker: { size: 10 } },
//       { x: [perfectPartner.x], y: [perfectPartner.y], mode: 'markers+text', text: ['The perfect partner'], textposition: 'top right', marker: { size: 10 } },
//       { x: [0,10], y: [0,10], mode: 'lines', line: { color: 'maroon' } },
//       { x: [0], y: [0], mode: 'markers+text', text: ['The worst possible partner'], textposition: 'bottom left', marker: { size: 8, color: 'red' } },
//     ],
//     layout: {
//       title: 'Should I marry this person?',
//       xaxis: { title: 'How much they love me', range: [0, 11], tickmode: 'array', tickvals: [0,2,4,6,8,10] },
//       yaxis: { title: 'How much I enjoy spending time with them', range: [0, 11], tickmode: 'array', tickvals: [0,2,4,6,8,10] },
//       width: 640,
//       height: 480,
//     }
//   }

//   const badnessScale = {
//     data: [
//       { x: [0, worstDist], y: [0, 0], mode: 'lines', line: { color: 'black' } },
//       { x: [marriedDist], y: [0], mode: 'markers+text', text: ['Married to them'], textposition: 'top center' },
//       { x: [0], y: [0], mode: 'markers+text', text: ['Perfect option'], textposition: 'top center' },
//       { x: [worstDist], y: [0], mode: 'markers+text', text: ['Worst option'], textposition: 'top center', marker: { color: 'red' } },
//     ],
//     layout: {
//       title: 'Badness (distance from perfect)',
//       xaxis: { title: 'Badness (distance)', showticklabels: false, range: [0, Math.max(worstDist, marriedDist) * 1.1] },
//       yaxis: { visible: false },
//       width: 700,
//       height: 160,
//     }
//   }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        On this page
      </Typography>
      {/* TODO: these don't work, and aren't very pretty */}
      <Typography component="div" paragraph>
        <ul>
          <li>
            <a href="#How it works">How it works</a>
          </li>
          <li>
            <a href="#Interpreting a single option">
              Interpreting a single option
            </a>
          </li>
          <li>
            <a href="#Good Practices">Good Practices</a>
          </li>
        </ul>
      </Typography>

      <Typography variant="h5" gutterBottom>
        How it works
      </Typography>
      <Typography paragraph>
        When making a big decision, it's important to consider all the factors,
        however it's also important to be confident in the process by which you
        make the decision. This program is a tool to help you make decisions,
        but its also important that you understand how it works so you can be
        confident in the answer it gives. Accordingly, here's an explanation of
        how it works. In addition, if you want a deeper understanding of how it
        works, feel free to <a href="https://github.com/smartycope/factorie">read the code</a> and understand how it works on a
        deeper level.
      </Typography>

      <Typography paragraph>
        The algorithm is based on a fairly simple idea: you want to make the
        choice that is closest to the best option you have. Say you're trying to
        decide what to have for dinner, and you only care about 2 things: taste
        and cost. You have a number of options, and you're trying to decide
        which one to make. You can intuit that the best option will balance
        taste and cost.
      </Typography>

      <Typography paragraph>
        Imagine a graph, where the x axis is taste and the y axis is cost. Each
        option is a point on the graph:
      </Typography>

      <img src={graph1} alt="Scatter plot example" />

      <Typography paragraph>
        You sit down and think about it, and you give tacos a 8/10 in taste, and
        they cost $10. Spaghetti costs $6, and you give it an 4/10 in taste.<br /><br />
        Which one is better? Spaghetti or Tacos? You like tacos more, but
        spaghetti is cheaper. <br /><br />Well now you can imagine your "perfect" meal.
        Everything you want in a single meal, even if it's impossible. You can't
        make it, but it's the best meal you can think of. Where would it be? The
        perfect meal would taste 10/10, and cost nothing, right?
      </Typography>

      <img src={graph2} alt="Scatter plot example" />

      <Typography paragraph>
        Now, the answer seems pretty clear. Just pick the option closest to the
        perfect meal, right?
      </Typography>
      <img src={graph3} alt="Scatter plot example" />

      <Typography paragraph>
        Spaghetti is closer to being the perfect meal, so it's better! The cost
        outweighs the taste. <br /><br />However, there's one thing we're assuming here.
        We're assuming we care about taste and cost the same amount. What if
        your paycheck just came in? You might care less about the cost now, but
        it does still matter. <br /><br />To take this into account, we have a "weight"
        value, or a "how much do I care?" value for each factor. You can think
        of this as "squishing" the axis of the graph.
      </Typography>

      <img src={graph4} alt="Scatter plot example" />

      <Typography paragraph>
        And there you have it! The tacos are now closer to the perfect meal.
        This makes sense: if you care less about money, you're more likely to
        pick the meal that tastes better. <br /><br />That's all there is to it! Of course,
        this is a very simple example. In real life, you likely have more
        factors, especially in big decisions. For example, you might care about
        the healthiness of the meal, or the time it takes to make it, or the
        amount of leftovers it leaves. <br /><br />To add more factors, you simply add more
        dimensions:
      </Typography>

      <img src={graph5} alt="Scatter plot example" />
      <Typography paragraph>
        Of course, this gets hard to visualize, but that math still works. You
        can add as many factors as you want, and the still calculate the
        distance between the options and the perfect option, even if it's hard
        to graph.
      </Typography>
      <Typography variant="h5" paragraph>
        Interpreting a single option
      </Typography>
      <Typography paragraph>
        Now consider the situation where you only have one option, and you're
        trying to decide if it's good enough. What does "good enough" mean? <br /><br />For
        example, say you're dating someone, and it's going pretty well, and
        you're trying to decide if you should marry them or not. You could put
        in your 2 options, "marry them" and "don't marry them", and then try to
        decide between them. But it can be hard to imagine what your life is
        like without them. So you essentially have 1 option that you're trying
        to decide if it's good enough. What do you do?<br /><br /> Well, let's adding some
        factors which relate to relationships, and try plotting it for starters:
      </Typography>
      <img src={graph6} alt="Scatter plot example" />
      <Typography paragraph>
        Ya, you enjoy spending time with them, but they also don't love you that
        much. But what if that's the best you could expect? Marrying someone is
        a big decision! We need some way of deciding if an option is "good
        enough". <br /><br />One way to do that is to calculate what the "worst" option is,
        and compare your option on a scale from the worst possible option to the
        best possible option.
      </Typography>
      <img src={graph7} alt="Scatter plot example" />
      <Typography paragraph>
        Yikes! They're not even 50% good! Maybe you shouldn't marry them... they
        don't seem that great after all. <br /><br />If we establish a threshold, especially
        before we evaluate a given partner, we can require that they pass that
        threshold. This could keep us from marrying someone we think we really
        like, but isn't actually that great.
      </Typography>
      <img src={graph8} alt="Scatter plot example" />
      <Typography paragraph>
        This threshold quantifies how "picky" you are. People tend to start off
        picky, and then get less picky over time as.
      </Typography>

      <Typography variant="h5" gutterBottom>
        Best Practices
      </Typography>
      <ul>
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
          Don't forget that you can quantify your emotions here. Emotions tend
          to be a valid part of any major decision. Try adding factors like
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
          going over them with a friend. If you want to tune the weights to get
          the decision you want, you probably can. Don't do that.
        </li>
        <li>
          This app is able to handle as many factors as you can think of. I've
          tested it up to 200 so far. However it may not handle as many options
          as well.
        </li>
      </ul>
    </Box>
  );
}
