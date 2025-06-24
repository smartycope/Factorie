import streamlit as st
from streamlit import session_state as ss
import pandas as pd

st.title("Add Factors")

l, r = st.columns(2)
mode = l.selectbox('Mode', ['Add', 'Edit'])
if mode == 'Add':
    quick = r.checkbox("Quick Add", value=False)
else:
    quick = False
with st.container(border=True):
    if mode == 'Edit':
        factor = st.selectbox("Factor", list(ss.decision.factors['names']), format_func=lambda f: f)
    else:
        factor = st.text_input("Factor")
    if not quick:
        unit = st.text_input("Unit", placeholder='0-10 scale', value=None if mode == 'Add' else ss.decision.factors['units'][list(ss.decision.factors['names']).index(factor)])
        optimal = st.number_input("Optimal", value=0 if mode == 'Add' else ss.decision.factors['optimals'][list(ss.decision.factors['names']).index(factor)])
        weight = st.slider("How much do you care?", 0, 10, 10 if mode == 'Add' else ss.decision.factors['weights'][list(ss.decision.factors['names']).index(factor)])
        l, r = st.columns(2)
        ll, lr = l.columns(2)
        rl, rr = r.columns(2)
        min_unbounded = lr.checkbox("Unbounded?", value=False if mode == 'Add' else ss.decision.factors['mins'][list(ss.decision.factors['names']).index(factor)] is None, key='1')
        min_ = ll.number_input("Min", value=0 if mode == 'Add' else ss.decision.factors['mins'][list(ss.decision.factors['names']).index(factor)], disabled=min_unbounded)
        max_unbounded = rr.checkbox("Unbounded?", value=False if mode == 'Add' else ss.decision.factors['maxs'][list(ss.decision.factors['names']).index(factor)] is None, key='2')
        max_ = rl.number_input("Max", value=10 if mode == 'Add' else ss.decision.factors['maxs'][list(ss.decision.factors['names']).index(factor)], disabled=max_unbounded)
    if mode == 'Add' and st.button("Add") and factor:
        if quick:
            ss.decision.add_factor(factor, '0-10 scale', 10, 10, 0, 10)
        else:
            ss.decision.add_factor(factor, unit, optimal, weight, min_, max_)
        st.rerun()
    elif mode == 'Edit' and st.button("Edit") and factor:
        ss.decision.edit_factor(factor, unit, optimal, weight, min_, max_)
        st.rerun()

st.divider()

"## Delete a Factor"
with st.form("remove_factor"):
    if ss.decision.factors['names']:  # Only show if there are factors to remove
        factor = st.selectbox("Factor", list(ss.decision.factors['names']))
        if st.form_submit_button("Remove"):
            ss.decision.remove_factor(factor)
            st.rerun()

st.divider()

"## Current Factors"
# I thiiink I like this one better?
st.dataframe(pd.DataFrame(ss.decision.factors).fillna('calculated'), hide_index=True)
# st.dataframe(pd.DataFrame(ss.decision.factors).T)
