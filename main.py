import streamlit as st
from streamlit import session_state as ss
import json
from src.classes.Decision import Decision

# Load testing config
def example_decision(which, empty=False):
    if which == 1:
        dec = 'What to eat.dec'
    elif which == 2:
        dec = 'What to do.dec'

    with open('examples/' + dec) as f:
        d = Decision.deserialize(f.read())
    if empty:
        d.clear_all_answers()
    return d

ss.example_decision = example_decision

if "decisions" not in ss:
    ss.decisions = [example_decision(1), example_decision(2)]

if "decision" not in ss:
    ss.decision = ss.decisions[0]

if 'texts' not in ss:
    ss.texts = json.load(open('texts.json'))

if 'available_factor_packs' not in ss:
    ss.available_factor_packs = set()

# Keep the current decision visible everywhere
st.set_page_config(page_title="Factorie", page_icon=":bar_chart:")

with st.sidebar:
    tmp = st.empty()
    st.divider()
    st.caption("Explanation for this page:")


st.navigation([
    st.Page('src/dashboard.py', title='Dashboard', default=True),
    st.Page('src/new_decision.py', title='Decisions'),
    st.Page('src/options.py', title='Options'),
    st.Page('src/factors.py', title='Factors'),
    st.Page('src/factor_packs.py', title='Factor Packs'),
    st.Page('src/weights.py', title='Fine Tune Weights'),
    st.Page('src/quiz.py', title='Answers'),
    st.Page('src/view_results.py', title='View Results'),
    st.Page('src/save.py', title='Import/Export'),
    st.Page('src/explanation.py', title='Explanation'),
    # st.Page('src/other.py', title='Other stuff (not a page)'),
]).run()

if ss.decision:
    tmp.title('Deciding: ' + ss.decision.name)
else:
    tmp.title('Please add a decision')

# Run with
# python3 -m streamlit run main.py --server.headless=true --server.runOnSave=true

_ = """
def example_decision(which, empty=False):
    if which == 1:
        d = Decision(name='What to eat')

        d.add_factor('Taste', '0-10', 10, .9, 0, 10)
        d.add_factor('Cost', '$', 0, 1, 0, None)
        d.add_factor('Healthiness', '0-10', 10, 1, 0, 10)
        d.add_factor('Time to Make', 'minutes', 0, .6, None, None)
        d.add_factor('Leftovers', 'portions', 5, .2, 0, None)
        d.add_factor('Test', 'na', 10, .5, 0, 10)

        d.add_option("Taco Bell")
        d.add_option("Spaghetti")
        d.add_option("Tacos")
        d.add_option("Leftovers")
        d.add_option("Chicken noodle soup")
        if not empty:
            d.set_answer("Taco Bell", "Taste", "8")
            d.set_answer("Taco Bell", "Cost", "15")
            d.set_answer("Taco Bell", "Healthiness", "6")
            d.set_answer("Taco Bell", "Time to Make", "15-30")
            d.set_answer("Taco Bell", "Leftovers", "1")
            d.set_answer("Spaghetti", "Taste", "3")
            d.set_answer("Spaghetti", "Cost", "5-6")
            d.set_answer("Spaghetti", "Healthiness", "8")
            d.set_answer("Spaghetti", "Time to Make", "20")
            d.set_answer("Spaghetti", "Leftovers", "1")
            d.set_answer("Tacos", "Taste", "10")
            d.set_answer("Tacos", "Cost", "8")
            d.set_answer("Tacos", "Healthiness", "9")
            d.set_answer("Tacos", "Time to Make", "10")
            d.set_answer("Tacos", "Leftovers", "1")
            d.set_answer("Leftovers", "Taste", "5")
            d.set_answer("Leftovers", "Cost", "1")
            d.set_answer("Leftovers", "Healthiness", "9")
            d.set_answer("Leftovers", "Time to Make", "5")
            d.set_answer("Leftovers", "Leftovers", "1")
            d.set_answer("Chicken noodle soup", "Taste", "9")
            d.set_answer("Chicken noodle soup", "Cost", "4")
            d.set_answer("Chicken noodle soup", "Healthiness", "10")
            d.set_answer("Chicken noodle soup", "Time to Make", "10")
            d.set_answer("Chicken noodle soup", "Leftovers", "5")

            d.set_answer("Taco Bell", "Test", str(.93*10))
            d.set_answer("Spaghetti", "Test", str(.07*10))
            d.set_answer("Tacos", "Test", "2-8")
            d.set_answer("Leftovers", "Test", "3-4")
            d.set_answer("Chicken noodle soup", "Test", "2-4")
        return d
    elif which == 2:
        d = Decision(name='What to do')
        d.add_factor('Fun', '0-10', 10, 1, 0, 10)
        d.add_factor('Time', 'minutes', 0, .6, None, None)
        d.add_factor('Cost', '$', 0, 1, 0, None)
        d.add_factor('Test', 'na', 10, .5, 0, 10)

        d.add_option("Watch Netflix")
        d.add_option("Play video games")
        d.add_option("Watch a movie")

        if not empty:
            d.set_answer("Watch Netflix", "Fun", "8")
            d.set_answer("Watch Netflix", "Time", "2")
            d.set_answer("Watch Netflix", "Cost", "1")
            d.set_answer("Watch Netflix", "Test", "10")
            d.set_answer("Play video games", "Fun", "10")
            d.set_answer("Play video games", "Time", "2")
            d.set_answer("Play video games", "Cost", "1")
            d.set_answer("Play video games", "Test", "10")
            d.set_answer("Watch a movie", "Fun", "8")
            d.set_answer("Watch a movie", "Time", "2")
            d.set_answer("Watch a movie", "Cost", "1")
            d.set_answer("Watch a movie", "Test", "10")
        return d
"""