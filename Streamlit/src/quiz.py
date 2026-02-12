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
    l, m, r = st.columns(3)
    if l.button("Go to the beginning"):
        ss.idx = 0
    if m.button('Delete all'):
        ss.decision.clear_all_answers()
        ss.idx = 0

    # Add snap to integer toggle
    # cb1, cb2 = r.columns(2)
    r.checkbox('Left to Right', value=True, key='anticolumnar')
    r.checkbox('Precise', value=True, key='precise')

    st.divider()

    option = ss.decision.options[index()[0]]
    factor = ss.decision.factors['names'][index()[1]]
    scale = ss.decision.factors['units'][index()[1]]
    if scale == '0-10':
        # st.title(f"How much `{factor}` does `{option}` have?")
        st.title(f"Rate `{option}` in terms of `{factor}`")
    else:
        # st.title(f"On a scale of {scale}, how much `{factor}` does `{option}` have?")
        st.title(f"How much `{factor}` does `{option}` have? (in {scale})")

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
    # snap = (ss.precise
    #     if  int(scale_min) == scale_min and
    #         int(scale_max) == scale_max and
    #         int(cur_min) == cur_min and
    #         int(cur_max) == cur_max
    #     else False
    # )
    if is_slider:
        step = .1 if ss.precise else 0.5
    else:
        step = .1 if ss.precise else 0.5

    type = st.number_input if not is_slider else st.slider

    if unsure:
        if is_slider:
            min_resp, max_resp = type(label=factor, min_value=scale_min, max_value=scale_max, value=(float(cur_min), float(cur_max)), step=step, format='%.1f')
        else:
            l, r = st.columns(2)
            with l:
                min_resp = type(label="Min " + factor.lower(), min_value=scale_min, max_value=scale_max, value=float(cur_min), step=step, format='%.1f')
            with r:
                max_resp = type(label="Max " + factor.lower(), min_value=scale_min, max_value=scale_max, value=float(cur_max), step=step, format='%.1f')

    else:
        resp = type(label=factor, min_value=scale_min, max_value=scale_max, value=float(cur_min), step=step, format='%.1f')

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
    # st.write(changed)
    # st.write(changed['level_0'])
    # st.write(changed['level_1'])
    # st.write(changed[0])
    # make sure the new value is within the min and max
    has_error = False
    for _, j in changed.iterrows():
        if (err := ss.decision.is_answer_invalid(j['level_0'], j['level_1'], j[0])):
            has_error = True
            st.error(f'Problem with option {j["level_0"]} with factor {j["level_1"]}: {err}')
    # st.write(df)
    # st.write(formatted_answers())
    if not has_error:
        if st.button('Save', key='direct_input_submit'):
            for _, j in changed.iterrows():
                ss.decision.set_answer(j['level_0'], j['level_1'], j[0])
            st.rerun()

a, b = st.tabs(['Quiz', 'Direct Input'])
with a:
    quiz()
    show_answers_static()
with b:
    direct_input()
# st.divider()

st.sidebar.write(ss.texts['answers']['explanation'])
