import streamlit as st
from streamlit import session_state as ss
from src.classes.FactorPack import FACTOR_PACKS

st.title("Factor Packs")

st.sidebar.write(ss.texts['factor_packs']['explanation'])

st.write(ss.texts['factor_packs']['page_explanation'])

cols = st.columns(len(FACTOR_PACKS))
for i, factor_pack in enumerate(FACTOR_PACKS):
    cols[i].image(factor_pack.image, caption=factor_pack.desc)

    if cols[i].button("Buy", key=i):
        ss.available_factor_packs.add(factor_pack)

# " ## My factor packs: "
# st.markdown(', '.join([f.name for f in ss.available_factor_packs]))

# "## Apply factor packs to a decision"
# desc = st.selectbox("Decision", ss.decisions, key="decision", format_func=lambda d: d.name)
# pack = st.selectbox("Factor pack", ss.available_factor_packs, key="factor_pack", format_func=lambda f: f.name)
# st.button("Apply", on_click=lambda: desc.apply_factor_pack(pack))
if ss.decision:
    "## Apply a factor pack to the current decision"
    pack = st.selectbox("Factor pack", ss.available_factor_packs, format_func=lambda f: f.name)
    if pack:
        if st.button("Apply"):
            ss.decision.apply_factor_pack(pack)
            st.success("Factor pack applied")
            st.rerun()

    "## Remove a factor pack from the current decision"
    pack2 = st.selectbox("Factor pack", ss.decision.factor_packs, key="factor_pack", format_func=lambda f: f.name)
    if pack2:
        if st.button("Remove"):
            ss.decision.remove_factor_pack(pack2)
            st.success("Factor pack removed")
            st.rerun()