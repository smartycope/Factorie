import streamlit as st
from streamlit import session_state as ss
import pandas as pd

st.title("Factors")

if ss.decision is None:
    st.warning("Please add a decision first")
    st.stop()

l, r = st.columns(2)
mode = l.selectbox('Add/Edit', ['Add', 'Edit'])

help_texts = ht = ss.texts['factors']

if mode == 'Add':
    quick = r.checkbox("Quick Add", value=False, help=ht['quick-add'])
    with st.container(border=True):
        factor = st.text_input("Factor", help=ht['factor'])
        if not quick:
            unit = st.text_input("Unit", placeholder='0-10 scale', value=None, key='1', help=ht['unit'])
            optimal = st.number_input("Optimal", value=0, key='2', help=ht['optimal'])
            weight = st.slider("How much do you care?", 0, 100, 100, format='%f%%', key='3', help=ht['weight']) / 100
            with st.container(border=True):
                st.subheader("Scale", help=ht['scale'])
                l, r = st.columns(2)
                ll, lr = l.columns(2)
                rl, rr = r.columns(2)
                min_unbounded = lr.checkbox("Unbounded?", value=False, key='5')
                min_ = ll.number_input("Min", value=0, disabled=min_unbounded, key='6')
                max_unbounded = rr.checkbox("Unbounded?", value=False, key='7')
                max_ = rl.number_input("Max", value=10, disabled=max_unbounded, key='8')
        if st.button("Add") and factor:
            if quick:
                # ss.decision.add_factor(factor, '0-10 scale', 10, 10, 0, 10)
                ss.decision.add_factor(factor)
            else:
                ss.decision.add_factor(factor, unit, optimal, weight, min_, max_)
            st.rerun()


elif mode == 'Edit':
    quick = False
    with st.container(border=True):
        if mode == 'Edit':
            factor = st.selectbox("Factor", list(ss.decision.factors['names']), format_func=lambda f: f, key='10')
        else:
            factor = st.text_input("Factor", key='11', help=ht['factor'])
        if not quick:
            unit = st.text_input("Unit", placeholder='0-10 scale', value=ss.decision.factors['units'][ss.decision.factors['names'].index(factor)], key='12', help=ht['unit'])
            optimal = st.number_input("Optimal", value=ss.decision.factors['optimals'][ss.decision.factors['names'].index(factor)], key='13', help=ht['optimal'])
            weight = st.slider("How much do you care?", 0, 100, value=int(ss.decision.factors['weights'][ss.decision.factors['names'].index(factor)]*100) if ss.decision.factors['weights'][ss.decision.factors['names'].index(factor)] else 100, format='%f%%', key='14', help=ht['weight']) / 100
            with st.container(border=True):
                st.subheader("Scale", help=ht['scale'])
                l, r = st.columns(2)
                ll, lr = l.columns(2)
                rl, rr = r.columns(2)
                min_unbounded = lr.checkbox("Unbounded?", ss.decision.factors['mins'][ss.decision.factors['names'].index(factor)] is None, key='15')
                min_ = ll.number_input("Min", value=ss.decision.factors['mins'][ss.decision.factors['names'].index(factor)], disabled=min_unbounded, key='16')
                max_unbounded = rr.checkbox("Unbounded?", ss.decision.factors['maxs'][ss.decision.factors['names'].index(factor)] is None, key='17')
                max_ = rl.number_input("Max", value=ss.decision.factors['maxs'][ss.decision.factors['names'].index(factor)], disabled=max_unbounded, key='18')

        if st.button("Edit") and factor:
            ss.decision.edit_factor(factor, unit, optimal, weight, min_, max_)
            st.rerun()

st.divider()

# "## Delete a Factor"
with st.form("remove_factor"):
    if ss.decision.factors['names']:
        factor = st.selectbox("Delete a Factor", list(ss.decision.factors['names']))
        if st.form_submit_button("Remove"):
            ss.decision.remove_factor(factor)
            st.rerun()

st.divider()

"## Current Factors"
st.info(""" I can't decide which I like better""")
data = pd.DataFrame(ss.decision.factors).fillna('calculated')
st.dataframe(data, hide_index=True)
# make the first column the column names
d = data.T
d.columns = d.iloc[0]
d = d[1:]
st.dataframe(d)

st.sidebar.write(ss.texts['factors']['explanation'])
