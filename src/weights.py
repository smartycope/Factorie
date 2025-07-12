import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from streamlit import session_state as ss

from src.multi_handled_slider import multi_handled_slider

st.title("Fine Tune Weights")

"""
How much each factor matters (the "weight" of each factor) can have a large
impact on the final result.
"""

labels = ss.decision.factors['names']# + [ss.decision.factors['names'][0]]
values = ss.decision.factors['weights']# + [ss.decision.factors['weights'][0]]
# sort labels and values by value
sorted_indices = np.argsort(values)
labels = np.array(labels)[sorted_indices]
values = np.array(values)[sorted_indices]


# names = ["a","b","c","d","e","f","g","h","i","j","k"]
# if 'vals' not in st.session_state:
    # ss.vals = np.linspace(0,1,11).tolist()
# These have to be sorted for overlap=False to work
# And apparently even then it doesn't really work that well

# st.write(dict(zip(labels, vals)))
# fig = px.bar(y=vals, x=names)
# st.plotly_chart(fig)

# st.write(st.session_state.vals)


def radar_line():
    fig = px.line_polar(r=values, theta=labels, line_close=False)
    fig.update_layout(
    polar=dict(
        bgcolor='rgba(0,0,0,0)',
        radialaxis=dict(
        visible=True,
        ),
    ),
    showlegend=False
    )
    st.plotly_chart(fig)

def radar_line_go():
    fig = go.Figure(data=go.Scatterpolar(
    r=values,
    theta=labels,
    ))

    fig.update_layout(
    polar=dict(
        radialaxis=dict(
        visible=True,
        ),
    ),
    showlegend=False
    )
    st.plotly_chart(fig)

def radar_bar():
    # Rotate labels and values
    # labels = np.roll(labels, 1 )
    # values = np.roll(values, 1 )

    fig = go.Figure(go.Barpolar(
        r=values,
        theta=labels,
        width=.7,
        # marker_color=["#E4FF87", '#709BFF', '#709BFF', '#FFAA70', '#FFAA70', '#FFDF70', '#B6FFB4'],
        # marker_line_color="black",
        # marker_line_width=2,
        opacity=0.8
    ))

    fig.update_layout(
        template=None,
        polar = dict(
            bgcolor='rgba(0,0,0,0)',
            radialaxis = dict(range=[0, 1], showticklabels=False, ticks=''),
            angularaxis = dict(showticklabels=True, tickfont_color='#F2F0EF'),

        ),
        paper_bgcolor='rgba(0,0,0,0)',
    )
    st.plotly_chart(fig)

def bar():
    fig = px.bar(x=labels, y=values)
    fig.update_yaxes(tickformat='.0%', title='Weight')
    # fig.update_traces(textposition='top left')
    fig.update_layout(xaxis_title='Factors', showlegend=False, xaxis=None)
    # fig.update_xaxes(showticklabels=False, ticks='')
    st.plotly_chart(fig)

def line():
    fig = px.line(y=values, text=labels)
    # Add points
    fig.add_scatter(x=labels, y=values, mode='markers')
    # offset the text by 0.1
    fig.update_traces(textposition='top center')
    fig.update_layout(xaxis_title='Factors', showlegend=False, xaxis=None)
    # Remove the x axis and name
    fig.update_xaxes(showticklabels=False, ticks='', range=[-.5, len(labels)-.5])
    fig.update_yaxes(tickformat='.0%', title='Weight')
    # fill below the line
    fig.update_traces(fill='tozeroy')
    st.plotly_chart(fig)

def line1d():
    fig = px.line(y=[0,0], x=[0,1])
    fig.add_scatter(x=values, y=np.zeros(len(values)), mode='markers', marker_color=values, marker_size=10, marker_colorscale='OrRd')
    fig.update_layout(xaxis=None, yaxis=None, showlegend=False)

    existing_positions = set()
    for x_val, label in zip(values, labels):
        # If they overlap, add an offset
        if x_val in existing_positions:
            x_val -= .05
        existing_positions.add(x_val)
        fig.add_annotation(
            x=x_val-.05,
            y=-0.2,
            text=label,
            showarrow=False,
            font=dict(color="white"),
            textangle=-45,
        )
    fig.add_annotation(
        x=1.05,
        y=0,
        text='Important',
        showarrow=False,
        font=dict(color="white", size=15),
        textangle=270,
    )

    fig.add_annotation(
        x=-.1,
        y=0,
        text='Unimportant',
        showarrow=False,
        font=dict(color="white", size=15),
        textangle=270,
    )

    # forcibly set the range_y
    fig.update_yaxes(range=[-1, 1], showticklabels=False, ticks='')
    fig.update_xaxes(range=[-.15, 1.1], showticklabels=True, tickmode='linear', tick0=0, dtick=0.2, tickformat='.0%')

    st.plotly_chart(fig)



tmp = st.empty()
with st.container(border=True):
    vals = multi_handled_slider(
        starting_values=values.tolist(),
        names=labels.tolist(),
        gradient=['#C1CBD6', '#002463'],
        overlap='push',
        start_text="Least Important",
        end_text="Most Important",
        show_values=True,
        digits=0,
        multiplier=100,
        prefix='',
        sep=' - ',
        suffix='%',
        step=.01,
        label_pos='switch',
        label_rotation=-35,
        # label_rotation=-90,
        # label_rotation=0,
        height=200,
        key='vals'
    )
    if st.button('Set as new weights'):
        ss.decision.factors['weights'] = vals
        st.rerun()

with st.expander('Visualizations', True):
    l, r = st.columns(2)
    with l:
        st.caption('a')
        radar_line()
        st.caption('b')
        line()
        st.caption('c')
        line1d()
    with r:
        st.caption('d')
        radar_bar()
        st.caption('e')
        bar()


if 'idx1' not in ss:
    ss.idx1 = 0
if 'asks' not in ss:
    ss.asks = []


def merge_sort_coroutine(arr):
    n = len(arr)
    if n <= 1:
        return arr

    def helper(arr):
        if len(arr) <= 1:
            return arr
        mid = len(arr) // 2
        left = yield from helper(arr[:mid])
        right = yield from helper(arr[mid:])
        merged = []

        i = j = 0
        while i < len(left) and j < len(right):
            # Yield the next comparison to be made
            comparison = yield (left[i], right[j])  # Send back True if left[i] < right[j]
            # If None is sent, they're equal
            if comparison is None:
                merged.append(left[i])
                i += 1
                j += 1
            elif comparison:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
        merged.extend(left[i:])
        merged.extend(right[j:])
        return merged

    sorted_arr = yield from helper(arr)
    return sorted_arr


# Keep state between reruns
if "sort_gen" not in ss:
    array = ss.decision.factors['names']
    ss.sort_gen = merge_sort_coroutine(array)
    ss.pending = next(ss.sort_gen)

if 'sorted' not in ss:
    ss.sorted = []


# def get_ask():
#     # if ss.idx1 == len(ss.decision.factors['names']) - 1:
#     if ss.idx1 > len(ss.asks):
#         ss.asks.append()
#     return ss.asks[ss.idx1]


with tmp:
    with st.expander('Sort Factors', True):
        with st.form('sort_factors', border=False):
            if st.form_submit_button('start over'):
                ss.sort_gen = merge_sort_coroutine(ss.decision.factors['names'])
                ss.pending = next(ss.sort_gen)
                ss.sorted = []
                st.rerun()

            if not ss.sorted:
                with st.container(border=True):
                    # """ Which factor is more important? """
                    # Show comparison buttons
                    a, b = ss.pending
                    l, m, r = st.columns(3)
                    val = st.select_slider(
                        "Which is more important?",
                        options=[a, "About the same", b],
                        value="About the same",
                    )
                    if st.form_submit_button('Next'):
                        try:
                            if val == a:
                                ss.pending = ss.sort_gen.send(True)
                            elif val == b:
                                ss.pending = ss.sort_gen.send(False)
                            elif val == "About the same":
                                ss.pending = ss.sort_gen.send(None)
                        except StopIteration as e:
                            ss.sorted = e.value
                        st.rerun()

                    # if l.button(f"{a}"):
                    #     try:
                    #         ss.pending = ss.sort_gen.send(True)
                    #     except StopIteration as e:
                    #         ss.sorted = e.value
                    #     st.rerun()
                    # if m.button("About the same"):
                    #     try:
                    #         ss.pending = ss.sort_gen.send(None)
                    #     except StopIteration as e:
                    #         ss.sorted = e.value
                    #     st.rerun()
                    # if r.button(f"{b}"):
                    #     try:
                    #         ss.pending = ss.sort_gen.send(False)
                    #     except StopIteration as e:
                    #         ss.sorted = e.value
                    #     st.rerun()

            else:
                st.success("Done!")
                """ In order of importance: """
                st.write("\n".join(f"{cnt}. {i}" for cnt, i in enumerate(ss.sorted, 1)))

                if st.form_submit_button('Set as new weights'):
                    labels = np.array(ss.sorted)
                    new_weights = np.linspace(1, 1/len(labels), len(labels))
                    ordered_labels = ss.decision.factors['names']
                    ordered_weights = np.zeros(len(ordered_labels))
                    for label, value in zip(labels, new_weights):
                        ordered_weights[ordered_labels.index(label)] = value
                    ss.decision.factors['weights'] = ordered_weights.tolist()
                    st.rerun()


st.sidebar.write(ss.texts['fine_tune_weights']['explanation'])