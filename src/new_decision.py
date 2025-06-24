import numpy as np
import pandas as pd
import streamlit as st
from streamlit import session_state as ss
from src.classes.Decision import Decision

if "decisions" not in ss:
    ss.decisions = []

st.title("Make or delete Decisions")

with st.form("new_decision"):
    name = st.text_input("Add a new decision")
    if st.form_submit_button("Add"):
        ss.decisions.append(Decision(name=name))
        st.rerun()

with st.form("delete_decision"):
    decision = st.selectbox("Delete a decision", ss.decisions, format_func=lambda d: d.name)
    if st.form_submit_button("Delete"):
        ss.decisions.remove(decision)
        st.write('A confirmation dialog will go here')

""" # Current decisions """
st.dataframe([d.name for d in ss.decisions])
