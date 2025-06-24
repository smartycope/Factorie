import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd

st.title("Quiz")

restart = st.button("Restart")
if "idx" not in ss or restart:
    ss.idx = 0

st.dataframe(ss.decision.answers)
st.divider()

def index():
    if ss.idx >= len(ss.decision.factors.keys()) * len(ss.decision.options):
        ss.idx = 0
    return ss.idx % len(ss.decision.options), ss.idx // len(ss.decision.options)


option = ss.decision.options[index()[0]]
factor = list(ss.decision.factors.keys())[index()[1]]
st.title(f"How much does {option} have {factor}?")
resp = st.slider(factor, ss.decision.factors[factor]['min'], ss.decision.factors[factor]['max'], ss.decision.factors[factor]['optimal'])
if st.button("Submit"):
    ss.decision.answers.loc[option, factor] = resp
    ss.idx += 1
    st.rerun()

l, r = st.columns(2)
if r.button("Next"):
    ss.idx += 1
    st.rerun()

if l.button("Back"):
    ss.idx -= 1
    st.rerun()
