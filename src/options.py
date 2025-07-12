import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd

st.title("Options")

if ss.decision is None:
    st.warning("Please add a decision first")
    st.stop()

st.dataframe(pd.DataFrame(ss.decision.options, columns=["Current Options"]), hide_index=True)


with st.form("add_option"):
    l, r = st.columns(2)
    option = l.text_input("Add an option")
    if r.form_submit_button("Add"):
        ss.decision.add_option(option)
        st.rerun()

with st.form("remove_option"):
    l, r = st.columns(2)
    option = l.selectbox("Delete an option", ss.decision.options)
    if r.form_submit_button("Delete"):
        ss.decision.remove_option(option)
        st.rerun()

# st.divider()
# "## Current Options"

st.sidebar.write(ss.texts['options']['explanation'])
