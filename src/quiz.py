import streamlit as st
from streamlit import session_state as ss
import numpy as np
import pandas as pd

if "idx" not in ss:
    ss.idx = 0


st.title("Answers")
if ss.decision is None:
    st.warning("Please add a decision first")
    st.stop()



def index():
    if ss.idx >= len(ss.decision.factors['names']) * len(ss.decision.options):
        ss.idx = 0
    if not ss.anticolumnar:
        return ss.idx % len(ss.decision.options), ss.idx // len(ss.decision.options)
    else:
        return ss.idx // (len(ss.decision.options)+1), ss.idx % (len(ss.decision.options)+1)

def formatted_answers():
    def formatter(x):
        if np.isnan(x[0]) or np.isnan(x[1]):
            return None
        return f'{x[0]:.0f}-{x[1]:.0f}' if x[0] != x[1] else f'{x[0]:.0f}'
    return np.array(list(map(formatter, ss.decision.answers.reshape(-1, 2)))).reshape(ss.decision.answers.shape[:2])

def show_answers_static():
    df = formatted_answers()
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

def quiz():
    l, m, r_col = st.columns(3)
    if l.button("Go to the beginning"):
        ss.idx = 0
    if m.button('Delete all'):
        ss.decision.clear_all_answers()
        ss.idx = 0

    # Add snap to integer toggle
    cb1, cb2 = r_col.columns(2)
    cb1.checkbox('Left to Right', value=True, key='anticolumnar')
    cb2.checkbox('Snap to integers', value=True, key='snap_to_int')

    st.divider()

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

    # Determine input type and step size
    is_slider = scale_min is not None and scale_max is not None
    if is_slider:
        step = 1 if ss.snap_to_int else 0.1
    else:
        step = 1 if ss.snap_to_int else None

    type = st.number_input if not is_slider else st.slider

    if unsure:
        min_resp = type(label='Minimum ' + factor, min_value=scale_min, max_value=scale_max, value=cur_min, step=step)
        max_resp = type(label='Maximum ' + factor, min_value=scale_min, max_value=scale_max, value=cur_max, step=step)
    else:
        resp = type(label=factor, min_value=scale_min, max_value=scale_max, value=float(cur_min), step=step)

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

def direct_input():
    df = st.data_editor(pd.DataFrame(formatted_answers(), columns=ss.decision.factors['names'], index=ss.decision.options))
    # Get the index which was changed
    changed = df[df != formatted_answers()].stack().reset_index()
    st.write(changed)
    # st.write(changed['level_0'])
    # st.write(changed['level_1'])
    # st.write(changed[0])
    # make sure the new value is within the min and max
    for _, j in changed.iterrows():
        try:
            ss.decision.set_answer(j['level_0'], j['level_1'], j[0])
        except ValueError as e:
            # factor_min = ss.decision.factors['mins'][ss.decision.factors['names'].index(j['level_1'])]
            # factor_max = ss.decision.factors['maxs'][ss.decision.factors['names'].index(j['level_1'])]
            # st.warning(f"Invalid answer or answer out of bounds: \"{j[0]}\" (min: {factor_min}, max: {factor_max})")
            st.error(e)
            print(e)
            st.exception(e)
            # st.error(str(e))

            # st.rerun()
    st.write(df)
    st.write(formatted_answers())

a, b = st.tabs(['Quiz', 'Direct Input'])
with a:
    quiz()
    show_answers_static()
with b:
    direct_input()
# st.divider()

st.sidebar.write(ss.texts['answers']['explanation'])
