import numpy as np
import pandas as pd
import streamlit as st
from streamlit import session_state as ss
from src.classes.Decision import Decision

if "decisions" not in ss:
    ss.decisions = []

"# What else would you like help deciding?"

with st.form("new_decision"):
    name = st.text_input("Add a new decision")
    if st.form_submit_button("Add"):
        if name in [d.name for d in ss.decisions]:
            st.warning("Decision already exists")
        else:
            ss.decisions.append(Decision(name=name))
            ss.decision = ss.decisions[-1]
            st.rerun()

with st.form("delete_decision"):
    decision = st.selectbox("Delete a decision", ss.decisions, format_func=lambda d: d.name)
    # st.write(decision.name)
    if st.form_submit_button("Delete"):
        ss.decisions.remove(decision)
        st.warning('A confirmation dialog will go here')
        st.rerun()

# """ # Current decisions """
# st.dataframe([d.name for d in ss.decisions])

st.sidebar.write(ss.texts['decisions']['explanation'])