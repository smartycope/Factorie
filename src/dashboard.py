import streamlit as st
from streamlit import session_state as ss
import pandas as pd
import plotly.express as px
import matplotlib.pyplot as plt
from src.classes.Decision import Decision

st.title("Name of App")
ss.decision = st.selectbox("You're currently deciding", ss.decisions, format_func=lambda d: d.name)


# st.title("Current Decisions")
st.dataframe(pd.DataFrame([d.name for d in ss.decisions], columns=["Current Decisions"]), hide_index=True)

# st.dataframe(ss.decision.weighted_answers(.5))
# if st.button("Clear all"):
#     ss.decisions = []
#     st.rerun()

st.divider()
with st.expander("🤫 (Only for testing)"):
    if st.button('load example 1'):
        d = ss.example_decision(1)
        try:
            ss.decisions.remove(d)
        except ValueError:
            pass
        ss.decisions.append(d)
        ss.decision = d
        st.rerun()
    if st.button('load unanswered example 1'):
        d = ss.example_decision(1, empty=True)
        try:
            ss.decisions.remove(d)
        except ValueError:
            pass
        ss.decisions.append(d)
        ss.decision = d
        st.rerun()
    if st.button('load example 2'):
        d = ss.example_decision(2)
        try:
            ss.decisions.remove(d)
        except ValueError:
            pass
        ss.decisions.append(d)
        ss.decision = d
        st.rerun()
    if st.button('load unanswered example 2'):
        d = ss.example_decision(2, empty=True)
        try:
            ss.decisions.remove(d)
        except ValueError:
            pass
        ss.decisions.append(d)
        ss.decision = d
        st.rerun()
    if st.button('clear all decisions'):
        ss.decisions = []
        st.rerun()
