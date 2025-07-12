import streamlit as st
from streamlit import session_state as ss
from src.classes.Decision import Decision

if ss.decisions:
    "# Export"
    l, r = st.columns(2, vertical_alignment='bottom')
    selected = l.selectbox("Select a decision to export", ss.decisions, format_func=lambda d: d.name)

    r.download_button("Download", data=selected.serialize(), file_name=selected.name + ".dec")

    st.divider()



"# Import"
if (file := st.file_uploader("Upload a decision", type="dec")):
    dec = Decision.deserialize(file.read())
    ss.decisions.append(dec)
    ss.decision = dec
    # st.rerun()



st.sidebar.write(ss.texts['save']['explanation'])