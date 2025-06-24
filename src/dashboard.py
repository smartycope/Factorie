import streamlit as st
from streamlit import session_state as ss
import pandas as pd
import plotly.express as px
import matplotlib.pyplot as plt

ss.decision = st.selectbox("Current Decision", ss.decisions, format_func=lambda d: d.name)

if st.button("Clear all"):
    ss.decisions = []
    st.rerun()

st.title("Decisions")
st.dataframe([d.name for d in ss.decisions], )
st.divider()

st.dataframe(ss.decision.weighted_answers(.5))
