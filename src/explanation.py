import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd
import re
from typing import Literal
import matplotlib.pyplot as plt

st.title("How it works")
"""
When making a big decision, it's important to consider all the factors, but it's also important to
be confident in the process by which you make the decision. This program is a tool to help you make decisions, but
it's also important that you understand how the decision is being made. Taking my word for is fine, but feel free
to read the code and understand how it works on a deeper level. For those of you who don't feel like learning
linear algebra and Python, I've made this explanation:

The algorithm is based on a fairly simple idea: you want to make the choice that is closest to the best option you have.

Say you're trying to decide what to have for dinner, and you only care about 2 things: taste and cost.
You have a number of options, and you're trying to decide which one to make. You can intuit that what you
choose will be a balance of taste and cost.

Imagine a graph, where the x axis is taste and the y axis is cost. Each option is a point on the graph:
"""


fig, ax = plt.subplots()
ax.set_title('What should I eat for dinner?')
ax.scatter([8,4], [10,6])
# ax.legend(["Tacos", "Spaghetti"], loc="upper left", bbox_to_anchor=(1,1))
ax.text(8, 10, "Tacos")
ax.text(4, 6, "Spaghetti")
ax.grid(True, which='major')
ax.set_aspect("equal")
ax.set_xlabel("Taste")
ax.set_ylabel("Cost")
# Make the ticks integers
r = range(0, 11, 2)
ax.set_xticks(r, labels=[f'{i}/10' for i in r])
ax.set_yticks(r, labels=[f'${i}' for i in r])
st.pyplot(fig)

"""
Tacos cost \$10, and you give them an 8/10 in taste.
Spaghetti costs \$6, and you give it an 4/10 in taste.

Which one is better? Spaghetti or Tacos? You like tacos more, but spaghetti is cheaper.

Well now imagine your "perfect" meal. Everything you want in a single meal, even if it's impossible.
You can't make it, but it's the best meal you can think of. Where would it be?
The perfect meal would taste 10/10, and cost nothing.
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
Spaghetti is "closer" to the perfect meal, so it's better. The cost outweighs the taste.

However, there's one thing we're assuming here. We're assuming we care about taste and cost the same amount.
What if you made more money this month, and you still care about the cost, but it doesn't matter as much as it did last month?
To take this into account, we have a "weight" value, or a "How much do I care?" value for each factor. You
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
st.pyplot(fig)


"""
And there you have it! The tacos are "closer" to the perfect meal. This makes sense: if you care less about money,
you're more likely to pick the meal that tastes better.

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
ax.set_zlabel("Healthiness (0-10)")
st.pyplot(fig)

"""
Of course, this gets hard to visualize, but that math still works. You can add as many factors as you want, and the
still calculate the distance between the options and the perfect option, even if it's hard to graph.

## Interpreting a single option
But what if you only have one option, and you're trying to decide if it's good enough or not? What does "good enough" mean?

For example, say you're dating someone, and it's going pretty well, and you're trying to decide if you should marry
them or not. You could add a bunch of factors, and have the options be "marry them" and "don't marry them", and then
decide between them:

(there's obviously a lot more factors than this, but for the sake of simplicity, let's just use 2)
"""

fig, ax = plt.subplots()
ax.set_title('Should I marry this person?')
ax.scatter([2, 3], [6, 9])
ax.scatter([10], [0])
ax.plot([2, 10], [6, 0], color="green")
ax.plot([3, 10], [9, 0], color="green")
ax.text(2, 6, "Married to them")
ax.text(3, 9, "Staying single")
ax.text(10, 0, "The perfect life")
ax.text(2, 3, f'Distance: ~{np.sqrt((10-2)**2 + (0-6)**2):.1f}')
ax.text(6, 5, f'Distance: ~{np.sqrt((10-3)**2 + (0-9)**2):.1f}')
ax.grid(True, which='major')
ax.set_aspect("equal")
ax.set_xlabel("How happy I am")
ax.set_ylabel("How lonely I am")
r = range(0, 11, 2)
ax.set_xticks(r)
ax.set_yticks(r)
st.pyplot(fig)

"""
Ya, you'd be less lonely with them, but you're also not that happy with them. Both of these options are kind of
far away from what you want. And marrying someone is a big decision! Maybe we need some way of deciding if
an option is "good enough".

One way to do that is to calculate what the "worst" option is, and use it as a comparison to the answers you have now.
to get the "worst possible distance" of the options. Then, we can compare the distance between the option and the
perfect option to the worst possible distance. If the option is closer to the perfect option than the worst possible distance,
then it's good enough.
"""

ax.scatter([0], [10], color="red")
ax.text(0, 10, "The worst that could happen")
ax.plot([10, 0], [0, 10], color="red")
ax.text(7, 3, f'Distance: ~{np.sqrt((10-0)**2 + (0-10)**2):.1f}', color='red')
st.pyplot(fig)

"""
That graph is looking pretty busy. Lets put the distances ("how bad" each option is) in a table instead:
"""

married_dist = np.sqrt((10-2)**2 + (0-6)**2)
single_dist = np.sqrt((10-3)**2 + (0-9)**2)
worst_dist = np.sqrt((10-0)**2 + (0-10)**2)
st.table([
    {
        "Option": "Married to them",
        "Distance": married_dist,
        "How bad they are compared to how bad they could be": f"{(married_dist / worst_dist * 100):.0f}% bad",
    },
    {
        "Option": "Staying single",
        "Distance": single_dist,
        "How bad they are compared to how bad they could be": f"{(single_dist / worst_dist * 100):.0f}% bad",
    },
    {
        "Option": "The worst that could happen",
        "Distance": worst_dist,
        "How bad they are compared to how bad they could be": f"{(worst_dist / worst_dist * 100):.0f}% bad",
    },
])

"""
So getting married isn't a great option, but it's better than the alternative? Well that's kinda depressing. Maybe
we should establish a threshold, and require that any option be better than that threshold to be considered "good enough"
to consider:
"""

fig, ax = plt.subplots()
ax.set_yticks([])
ax.plot([0, worst_dist], [0, 0], color='black')
ax.scatter([married_dist, single_dist], [0, 0])
ax.scatter([0], [0])
ax.text(married_dist, 0, "Married to them", rotation=70)
ax.text(single_dist, 0, "Staying single", rotation=70)
ax.text(0, 0, "Perfect option", rotation=70)
ax.scatter([worst_dist], [0], color="red")
ax.text(worst_dist, 0, "Worst option", rotation=70)
ax.plot([worst_dist * .4, worst_dist*.4], [.2, -.2], color="pink")
ax.text(worst_dist * .2, .2, "Threshold = <40% bad", color="pink")
ax.set_xlabel("Badness (distance from perfect)")
st.pyplot(fig)

"""
This threshold quantifies how "picky" you are. When dating, it might be a good idea to be at least a little picky,
You might also get less picky over time (when you first start dating, they have to be perfect, but your standards may (or may not
) lower over time)
"""

"""
## Good Practices
* If you get an answer, and you go, "what, that's not right!", it's likely wrong. This program generally tells you what
you already know, by helping you break it down. If you're surprised, you might need to add more factors. For example, if
you got the answer "make chicken noodle soup", and go "ugh, but that's so much effort!", maybe you need to add an
"effort" factor, or maybe the "effort" factor is weighted too low. Unless you don't *want* to care about the effort, in
which case it's telling you you're being lazy.

* Don't forget that you can quantify your emotions here. Emotions are generally a valid part of any major decision. Try
adding factors like "happiness" or "How much I want to"

* Factors can be almost anything. Emotions, person preference, objective measurements, literally anything that is relevant
to the decision. The more factors, the more accurate your answer will be.

* "Garbage in, Garbage out".
You can certainly throw some values in to see how it looks. But keep in mind that it won't necessarily be a very accurate answer.
If you're making a big decision, really think about the values you put in.

* Don't care about everything. Usually, all the factors aren't equally relevant. The weights can change your answer easily,
be sure you choose them carefully. I've included a "weight" adjuster for just this purpose, so you can fine tune how much
you care about each factor. Just don't use it to get the answer you want!

* This is self-reported. For best results, try to set the weights and threshold objectively: either before you have to
make the decision, going over them with a friend.
"""