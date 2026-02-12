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
    ss.decisions = []

if "decision" not in ss:
    ss.decision = None

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
]).run()

if ss.decision:
    tmp.title('Deciding: ' + ss.decision.name)
else:
    tmp.title('Please add a decision')
