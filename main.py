import streamlit as st
from streamlit import session_state as ss
from src.classes.Decision import Decision

# Load testing config
if "decisions" not in ss:
    d = Decision(name='What to eat')

    d.add_factor('Taste', '0-10 scale', 10, 9, 0, 10)
    d.add_factor('Cost', '$', 0, 10, 0, None)
    d.add_factor('Healthiness', '0-10', 10, 10, 0, 10)
    d.add_factor('Time to Make', 'minutes', 0, 6, None, None)
    d.add_factor('Leftovers', 'portions', 5, 2, 0, None)
    d.add_factor('Test', 'na', 10, 5, 0, 10)

    d.add_option("Taco Bell")
    d.add_option("Spaghetti")
    d.add_option("Tacos")
    d.add_option("Leftovers")
    d.add_option("Chicken noodle soup")

    d.add_answer("Taco Bell", "Taste", "8")
    d.add_answer("Taco Bell", "Cost", "15")
    d.add_answer("Taco Bell", "Healthiness", "6")
    d.add_answer("Taco Bell", "Time to Make", "15-30")
    d.add_answer("Taco Bell", "Leftovers", "1")
    d.add_answer("Taco Bell", "Test", "10")
    d.add_answer("Spaghetti", "Taste", "3")
    d.add_answer("Spaghetti", "Cost", "5-6")
    d.add_answer("Spaghetti", "Healthiness", "8")
    d.add_answer("Spaghetti", "Time to Make", "20")
    d.add_answer("Spaghetti", "Leftovers", "1")
    d.add_answer("Spaghetti", "Test", "0-10")
    d.add_answer("Tacos", "Taste", "10")
    d.add_answer("Tacos", "Cost", "8")
    d.add_answer("Tacos", "Healthiness", "9")
    d.add_answer("Tacos", "Time to Make", "10")
    d.add_answer("Tacos", "Leftovers", "1")
    d.add_answer("Tacos", "Test", "3-5")
    d.add_answer("Leftovers", "Taste", "5")
    d.add_answer("Leftovers", "Cost", "1")
    d.add_answer("Leftovers", "Healthiness", "9")
    d.add_answer("Leftovers", "Time to Make", "5")
    d.add_answer("Leftovers", "Leftovers", "1")
    d.add_answer("Leftovers", "Test", "0")
    d.add_answer("Chicken noodle soup", "Taste", "9")
    d.add_answer("Chicken noodle soup", "Cost", "4")
    d.add_answer("Chicken noodle soup", "Healthiness", "10")
    d.add_answer("Chicken noodle soup", "Time to Make", "10")
    d.add_answer("Chicken noodle soup", "Leftovers", "2")
    d.add_answer("Chicken noodle soup", "Test", "5")

    d2 = Decision(name='What to do')
    d2.add_factor('Fun', '0-10', 10, 10, 0, 10)
    d2.add_factor('Time', 'minutes', 0, 6, None, None)
    d2.add_factor('Cost', '$', 0, 10, 0, None)
    d2.add_factor('Test', 'na', 10, 5, 0, 10)

    d2.add_option("Watch Netflix")
    d2.add_option("Play video games")
    d2.add_option("Watch a movie")

    d2.add_answer("Watch Netflix", "Fun", "8")
    d2.add_answer("Watch Netflix", "Time", "2")
    d2.add_answer("Watch Netflix", "Cost", "1")
    d2.add_answer("Watch Netflix", "Test", "10")
    d2.add_answer("Play video games", "Fun", "10")
    d2.add_answer("Play video games", "Time", "2")
    d2.add_answer("Play video games", "Cost", "1")
    d2.add_answer("Play video games", "Test", "10")
    d2.add_answer("Watch a movie", "Fun", "8")
    d2.add_answer("Watch a movie", "Time", "2")
    d2.add_answer("Watch a movie", "Cost", "1")
    d2.add_answer("Watch a movie", "Test", "10")

    ss.decisions = [d, d2]

if "decision" not in ss:
    ss.decision = ss.decisions[0]

# Keep the current decision visible everywhere
st.set_page_config(page_title="Factorie", page_icon=":bar_chart:")
st.sidebar.title(ss.decision.name)

st.navigation([
    st.Page('src/dashboard.py', title='Dashboard', default=True),
    st.Page('src/new_decision.py', title='New Decision'),
    st.Page('src/quiz.py', title='Quiz'),
    st.Page('src/factors.py', title='Factors'),
    st.Page('src/options.py', title='Options'),
    st.Page('src/view_results.py', title='View Results'),
    st.Page('src/explanation.py', title='Explanation'),
]).run()