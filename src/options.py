import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd

st.title("Add Options")

with st.form("add_option"):
    option = st.text_input("Add an option")
    if st.form_submit_button("Add"):
        ss.decision.add_option(option)
        st.rerun()

with st.form("remove_option"):
    option = st.selectbox("Delete an option", ss.decision.options)
    if st.form_submit_button("Delete"):
        ss.decision.remove_option(option)
        st.rerun()

st.dataframe(ss.decision.options)
