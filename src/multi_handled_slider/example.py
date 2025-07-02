import streamlit as st
from multi_handled_slider import multi_handled_slider
import numpy as np
import plotly.express as px

names = ["a","b","c","d","e","f","g","h","i","j","k"]
if 'vals' not in st.session_state:
    st.session_state.vals = np.linspace(0,1,11).tolist()
vals = multi_handled_slider(
    starting_values=st.session_state.vals,
    names=names,
    gradient=['#C1CBD6', '#002463'],
    overlap=False,
    start_text="Start",
    end_text="End",
    show_values=True,
    digits=0,
    multiplier=100,
    prefix='',
    sep=' - ',
    suffix='%',
    step=.01,
    label_pos='top',
    label_rotation=-35,
    key='vals'
)
# st.write(vals)

fig = px.bar(y=vals, x=names)
st.plotly_chart(fig)

st.write(st.session_state.vals)