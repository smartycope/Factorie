import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd
import re
from typing import Literal
import matplotlib.pyplot as plt


"""
# On this page
* [How it works](#how-it-works)
* [Interpreting a single option](#interpreting-a-single-option)
* [Good Practices](#good-practices)
"""

"""
## How it works
When making a big decision, it's important to consider all the factors, however it's also important to
be confident in the process by which you make the decision. This program is a tool to help you make decisions,
but its also important that you understand how it works so you can be confident in the answer it gives. Accordingly, here's an explanation of how it works. In addition, if you want a deeper understanding of how it works, feel free to [read the code](https://github.com/smartycope/factorie) and understand how it works on a deeper level.

The algorithm is based on a fairly simple idea: you want to make the choice that is closest to the best option you have. Say you're trying to decide what to have for dinner, and you only care about 2 things: taste and cost.
You have a number of options, and you're trying to decide which one to make. You can intuit that the best option will balance taste and cost.

Imagine a graph, where the x axis is taste and the y axis is cost. Each option is a point on the graph:
"""


fig, ax = plt.subplots()
ax.set_title('What should I eat for dinner?')
ax.scatter([8,4], [10,6])
ax.text(8, 10, "Tacos")
ax.text(4, 6, "Spaghetti")
ax.grid(False, which='major')
ax.set_aspect("equal")
ax.set_xlabel("Taste")
ax.set_ylabel("Cost")
# Make the ticks integers
r = range(0, 11, 2)
ax.set_xticks(r, labels=[f'{i}/10' for i in r])
ax.set_yticks(r, labels=[f'${i}' for i in r])
st.pyplot(fig)

"""
You sit down and think about it, and you give tacos a 8/10 in taste, and they cost \$10.
Spaghetti costs \$6, and you give it an 4/10 in taste.

Which one is better? Spaghetti or Tacos? You like tacos more, but spaghetti is cheaper.

Well now you can imagine your "perfect" meal. Everything you want in a single meal, even if it's impossible.
You can't make it, but it's the best meal you can think of. Where would it be?
The perfect meal would taste 10/10, and cost nothing, right?
"""

ax.scatter([10], [0])
ax.text(10, 0, "Perfect Meal")
ax.set_xticks(r)
ax.set_yticks(r)
st.pyplot(fig)

"""
Now, the answer seems pretty clear. Just pick the option closest to the perfect meal, right?
"""

ax.plot([8, 10], [10, 0], color="green")
ax.plot([4, 10], [6, 0], color="green")
ax.set_xticks(r)
ax.set_yticks(r)
ax.text(9, 5, f"Distance: ~{np.sqrt((10-8)**2 + (0-10)**2):.1f}")
ax.text(6, 3.5, f"Distance: ~{np.sqrt((10-4)**2 + (0-6)**2):.1f}")
st.pyplot(fig)

"""
Spaghetti is closer to being the perfect meal, so it's better! The cost outweighs the taste.

However, there's one thing we're assuming here. We're assuming we care about taste and cost the same amount.
What if your paycheck just came in? You might care less about the cost now, but it does still matter.

To take this into account, we have a "weight" value, or a "how much do I care?" value for each factor. You
can think of this as "squishing" the axis of the graph.
"""

# Remove the previous distance labels
for text in ax.texts:
    if text.get_text().startswith("Distance"):
        text.remove()
ax.set_xlabel("Taste - 100% weight")
ax.set_ylabel("Cost - 50% weight")
ax.set_aspect(.5)
ax.text(9, 5, f"Distance: ~{np.sqrt((10-8)**2 + ((0-10)*.5)**2):.1f}")
ax.text(6, 3.5, f"Distance: ~{np.sqrt((10-4)**2 + ((0-6)*.5)**2):.1f}")
ax.set_xticks(r)
ax.set_yticks(r)
# Add an arrow on the side of the graph pointing down
ax.annotate("", xy=(0, 5), xytext=(0, 11), arrowprops=dict(facecolor='black', shrink=0.05))
st.pyplot(fig)


"""
And there you have it! The tacos are now closer to the perfect meal. This makes sense: if you care less about
money, you're more likely to pick the meal that tastes better.

That's all there is to it! Of course, this is a very simple example. In real life, you likely have more factors, especially in big decisions.
For example, you might care about the healthiness of the meal, or the time it takes to make it, or the amount of leftovers it leaves.

To add more factors, you simply add more dimensions:
"""

# Make a 3d plot
fig = plt.figure()
ax = fig.add_subplot(111, projection='3d')
ax.set_title('What should I eat for dinner?')
ax.scatter([8,4], [10,6], [4,8])
ax.scatter([10], [0], [10])
ax.plot([8, 10], [10, 0], [4, 10], color="green")
ax.plot([4, 10], [6, 0], [8, 10], color="green")
ax.text(8, 10, 4, "Tacos")
ax.text(4, 6, 8, "Spaghetti")
ax.text(10, 0, 10, "Perfect Meal")
ax.set_xticks(r)
ax.set_yticks(r)
ax.set_zticks(r)
ax.set_xlabel("Taste (0-10)")
ax.set_ylabel("Cost ($)")
ax.set_zlabel("Healthiness (0-10)", labelpad=-15)
st.pyplot(fig)

"""
Of course, this gets hard to visualize, but that math still works. You can add as many factors as you want, and
the still calculate the distance between the options and the perfect option, even if it's hard to graph.

## Interpreting a single option
Now consider the situation where you only have one option, and you're trying to decide if it's good enough. What does "good enough" mean?

For example, say you're dating someone, and it's going pretty well, and you're trying to decide if you should
marry them or not. You could put in your 2 options, "marry them" and "don't marry them", and then try to decide
between them. But it can be hard to imagine what your life is like without them. So you essentially have 1
option that you're trying to decide if it's good enough. What do you do?

Well, let's adding some factors which relate to relationships, and try plotting it for starters:
"""

fig, ax = plt.subplots()
ax.set_title('Should I marry this person?')
ax.scatter([2], [6])
ax.scatter([10], [10])
ax.plot([2, 10], [6, 10], color="green")
# ax.plot([3, 10], [9, 0], color="green")
ax.text(2, 6, 'Your partner')
# ax.text(3, 9, "Staying single")
ax.text(10, 10, "The perfect partner")
ax.text(4, 9, f'Distance: ~{np.sqrt((10-2)**2 + (10-6)**2):.1f}')
# ax.text(6, 5, f'Distance: ~{np.sqrt((10-3)**2 + (0-9)**2):.1f}')
ax.grid(False, which='major')
ax.set_aspect("equal")
ax.set_xlabel("How much they love me")
ax.set_ylabel("How much I enjoy spending time with them")
r = range(0, 11, 2)
ax.set_xticks(r)
ax.set_yticks(r)
st.pyplot(fig)

"""
Ya, you enjoy spending time with them, but they also don't love you that much. But what if that's the best you could expect? Marrying someone is a big decision! We need some way of deciding if an option is "good enough".

One way to do that is to calculate what the "worst" option is, and compare your option on a scale from the worst possible option to the best possible option.
"""

ax.scatter([0], [0], color="red")
ax.text(0, 0, "The worst possible partner")
ax.plot([0, 10], [0, 10], color="maroon")
# ax.plot([, 10], [0, 10], color="maroon")
ax.scatter([5], [5], color="maroon", s=15)
ax.text(5.2, 4.8, "50% bad")
ax.text(6.5, 6, f'Distance: ~{np.sqrt((10-0)**2 + (10-0)**2):.1f}', color='maroon')
ax.text(2, 8.5, f'{np.sqrt((10-2)**2 + (10-6)**2):.1f} / {np.sqrt((10-0)**2 + (10-0)**2):.1f} = ~{np.sqrt((10-2)**2 + (10-6)**2)/np.sqrt((10-0)**2 + (10-0)**2):.0%} bad')
st.pyplot(fig)

"""
Yikes! They're not even 50% good! Maybe you shouldn't marry them... they don't seem that great after all.

"""

married_dist = np.sqrt((10-2)**2 + (10-6)**2)
worst_dist = np.sqrt((10-0)**2 + (10-0)**2)
# st.table([
#     {
#         "Option": "Married to them",
#         "Distance": f'{married_dist:.1f}',
#         "How bad they are compared to the worst possible partner": f"{(married_dist / worst_dist * 100):.0f}% bad",
#     },
#     {
#         "Option": "The worst possible partner",
#         "Distance": f'{worst_dist:.1f}',
#         "How bad they are compared to the worst possible partner": f"{(worst_dist / worst_dist * 100):.0f}% bad",
#     },
# ])

"""
If we establish a threshold, especially *before* we evaluate a given partner, we can require that they
pass that threshold. This could keep us from marrying someone we think we really like, but isn't actually
that great.
"""

fig, ax = plt.subplots(figsize=(8, 3))
ax.set_yticks([])
ax.set_xticks([])
ax.plot([0, worst_dist], [0, 0], color='black')
ax.scatter([married_dist], [0])
ax.scatter([0], [0])
ax.text(married_dist, .02, "Married to them", rotation=90)
ax.text(0, .02, "Perfect option", rotation=90)
ax.scatter([worst_dist], [0], color="red")
ax.text(worst_dist, .02, "Worst option", rotation=90)
ax.plot([worst_dist * .4, worst_dist*.4], [.2, -.2], color="pink")
ax.text(worst_dist * .2, .19, "Threshold = <40% bad", color="pink")
ax.set_xlabel("Badness (distance from perfect)")
st.pyplot(fig)

"""
This threshold quantifies how "picky" you are. People tend to start off picky, and then get less picky over
time as.
"""

"""
## Best Practices
* If you get an answer, and you go, "what? That's not right!", you're probably right. This program generally tells you what
you already know. It's supposed to help you break a decision down to make it easier to analyze. If you're surprised, you might need to add more factors. For example, if
you got the answer "make chicken noodle soup", and go "ugh, but that's so much effort!", maybe you need to add an
"effort" factor, or maybe the "effort" factor is weighted too low. (Unless you intentionally weighted it low because you don't *want* to care about the effort, in
which case it's telling you you're being lazy.)

* Don't forget that you can quantify your emotions here. Emotions tend to be a valid part of any major decision. Try
adding factors like "happiness" or "How much I want to"

* Factors can be almost anything. Emotions, person preference, objective measurements, literally anything that is relevant
to the decision. The more factors, the more accurate your answer will be.

* "Garbage in, Garbage out".
You can certainly throw some values in to see how it looks. But keep in mind that it won't necessarily be a very accurate answer.
If you're making a big decision, really think about the values you put in.

* Don't care about everything. Usually, all the factors aren't equally relevant. The weights can have a large impact on the result,
be sure you choose them carefully. I've included a whole page just for fine tuning how much
you care about each factor.

* This is self-reported. For best results, try to set the weights and threshold objectively: either before you have to
make the decision, going over them with a friend. If you want to tune the weights to get the decision you want,
you probably can. Don't do that.

* This app is able to handle as many factors as you can think of. I've tested it up to 200 so far. However it
may not handle as many options as well.
"""

st.sidebar.write(ss.texts['explanation']['explanation'])