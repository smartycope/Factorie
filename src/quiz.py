import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd

if "idx" not in ss:
    ss.idx = 0

st.title("Data")

l, m, r = st.columns(3)
if l.button("Go to the beginning"):
    ss.idx = 0
if m.button('Delete all'):
    ss.decision.clear_all_answers()
    ss.idx = 0

columnar = not r.checkbox('Left to Right', value=True)



def index():
    if ss.idx >= len(ss.decision.factors['names']) * len(ss.decision.options):
        ss.idx = 0
    if columnar:
        return ss.idx % len(ss.decision.options), ss.idx // len(ss.decision.options)
    else:
        return ss.idx // (len(ss.decision.options)+1), ss.idx % (len(ss.decision.options)+1)


def show_answers():
    # st.dataframe(np.vectorize(lambda x:f'{x[0]}-{x[1]}' if x[0] != x[1] else str(x[0]), signature='(2)->()')(ss.decision.answers))
        # return np.fromiter((f(xi) for xi in x), x.dtype)
    # st.dataframe(np.fromiter(((f'{xi[0]}-{xi[1]}' if xi[0] != xi[1] else str(xi[0])) for xi in ss.decision.answers), ss.decision.answers.dtype).reshape(ss.decision.answers.shape))
    def formatter(x):
        if np.isnan(x[0]) or np.isnan(x[1]):
            return None
        return f'{x[0]:.0f}-{x[1]:.0f}' if x[0] != x[1] else f'{x[0]:.0f}'
    df = np.array(list(map(formatter, ss.decision.answers.reshape(-1, 2)))).reshape(ss.decision.answers.shape[:2])
    # highlight the current index
    target_index, target_column = index()

    def style(styler):
        styler.highlight_null(color='#550000')
        styler.apply(lambda x: pd.DataFrame([
            ['background-color: yellow' if (i == ss.decision.options[target_index] and j == ss.decision.factors['names'][target_column]) else ''
            for j in x.columns]
            for i in x.index
        ], index=x.index, columns=x.columns), axis=None)
        return styler

    st.dataframe(pd.DataFrame(df, columns=ss.decision.factors['names'], index=ss.decision.options).style.pipe(style))



option = ss.decision.options[index()[0]]
factor = ss.decision.factors['names'][index()[1]]
st.title(f"On a scale of {ss.decision.factors['units'][index()[1]]}, how much `{factor}` does `{option}` have?")

scale_min = float(ss.decision.factors['mins'][index()[1]]) if ss.decision.factors['mins'][index()[1]] is not None else None
scale_max = float(ss.decision.factors['maxs'][index()[1]]) if ss.decision.factors['maxs'][index()[1]] is not None else None
current = ss.decision.get_answer(option, factor)# or ss.decision.factors['optimals'][index()[1]]
if current is not None and not np.isnan(current).any():
    cur_min, cur_max = current
else:
    cur_min = cur_max = ss.decision.factors['optimals'][index()[1]]

unsure = st.checkbox("I'm not sure", value=cur_min != cur_max)

type = st.number_input if scale_min is None or scale_max is None else st.slider
if unsure:
    min_resp = type(label='Minimum ' + factor, min_value=scale_min, max_value=scale_max, value=cur_min)
    max_resp = type(label='Maximum ' + factor, min_value=scale_min, max_value=scale_max, value=cur_max)
else:
    resp = type(label=factor, min_value=scale_min, max_value=scale_max, value=float(cur_min))



l, m, r = st.columns(3)
if m.button("Submit"):
    if unsure:
        ss.decision.set_answer(option, factor, [min_resp, max_resp])
    else:
        ss.decision.set_answer(option, factor, resp)
    ss.idx += 1
    st.rerun()

if r.button("Skip"):
    ss.idx += 1
    st.rerun()

if l.button("Back"):
    ss.idx -= 1
    st.rerun()

st.divider()
show_answers()

st.sidebar.write(ss.texts['answers']['explanation'])