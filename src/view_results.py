import re
from typing import Literal

from string import ascii_uppercase
import matplotlib
import matplotlib.colors
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import streamlit as st
from matplotlib.collections import LineCollection
from streamlit import session_state as ss

import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from src.classes.Decision import Decision

from sklearn.decomposition import PCA
import plotly.express as px
import umap.umap_ as umap
from sklearn.metrics import pairwise_distances
import plotly.figure_factory as ff
from sklearn.manifold import MDS
import pandas as pd
import plotly.express as px
import matplotlib.pyplot as plt
import numpy as np

# ss.factors
# ss.answers
# colorscale = 'YlOrRd'
colorscale = 'Reds'
# norm=plt.Normalize(-2,2)
# colorscale = matplotlib.colors.LinearSegmentedColormap.from_list("", ["white","red"])
@st.cache_data
def calculate():
    calc = ss.decision.calculate_all(method='threshold')
    return calc
# st.write(calculate())
# st.stop()
calc = calculate()
optimal_normalized = ss.decision.optimal_normalized
worst_possible_option_normalized = ss.decision.worst_possible_option_normalized
worst_possible_distance = ss.decision.worst_possible_distance
normalized_answers = calc['mean']['normalized_answers']
normalized_answers_conf = calc['std']['normalized_answers']
delta_vectors_normalized = calc['mean']['delta_vectors_normalized']
delta_vectors_normalized_conf = calc['std']['delta_vectors_normalized']
weighted_delta_vectors_normalized = calc['mean']['weighted_delta_vectors_normalized']
weighted_delta_vectors_normalized_conf = calc['std']['weighted_delta_vectors_normalized']
weighted_delta_magnitudes = calc['mean']['weighted_delta_magnitudes']
weighted_delta_magnitudes_conf = calc['std']['weighted_delta_magnitudes']
per_option_contributions = calc['mean']['per_option_contributions']
per_option_contributions_conf = calc['std']['per_option_contributions']
objective_contributions = calc['mean']['objective_contributions']
objective_contributions_conf = calc['std']['objective_contributions']
mean_factor_relevances = calc['mean']['mean_factor_relevances']
mean_factor_relevances_conf = calc['std']['mean_factor_relevances']
normalized_weighted_dists = badness = calc['mean']['badness']
normalized_weighted_dists_conf = badness_conf = calc['std']['badness']
inverted_normalized_weighted_dists = goodness = calc['mean']['goodness']
inverted_normalized_weighted_dists_conf = goodness_conf = calc['std']['goodness']
best = calc['best']
worst = calc['worst']
answers = ss.decision.weighted_answers(.5)

results = pd.DataFrame({
        'Score': normalized_weighted_dists,
        'Option': ss.decision.options,
        'Percentage': normalized_weighted_dists*100})\
    .sort_values(by='Score', ascending=True).reset_index(drop=True)


st.sidebar.write(ss.texts['view_results']['explanation'])

def join_and(items, oxford=False, ampersand=False):
    and_ = ' & ' if ampersand else ' and '
    if oxford:
        and_ = ',' + and_
    if len(items) == 1:
        return items[0]
    elif len(items) == 2:
        return and_.join(items)
    else:
        return ', '.join(items[:-1]) + and_ + items[-1]

def internals():
    with st.sidebar:
        with st.expander("parsed_values"):
            st.write(answers)

        with st.expander("parsed_stds"):
            st.write(ss.decision.std_answers)

        with st.expander("mins"):
            st.write(ss.decision.mins)

        with st.expander("maxs"):
            st.write(ss.decision.maxs)

        with st.expander('optimal_normalized'):
            optimal_normalized
        with st.expander('worst_possible_option_normalized'):
            worst_possible_option_normalized
        with st.expander('worst_possible_distance'):
            worst_possible_distance
        with st.expander('normalized_answers'):
            normalized_answers
        with st.expander('delta_vectors_normalized'):
            delta_vectors_normalized
        with st.expander('weighted_delta_vectors_normalized'):
            weighted_delta_vectors_normalized
        with st.expander('weighted_delta_magnitudes'):
            weighted_delta_magnitudes
        with st.expander('per_option_contributions'):
            per_option_contributions
        with st.expander('objective_contributions'):
            objective_contributions
        with st.expander('mean_factor_relevances'):
            mean_factor_relevances
        with st.expander('normalized_weighted_dists'):
            normalized_weighted_dists
        with st.expander('inverted_normalized_weighted_dists'):
            inverted_normalized_weighted_dists

        with st.expander('goodness'):
            st.write(goodness)
        with st.expander('badness'):
            st.write(badness)

def results_explanation():
    st.write(f"""
    The best option is `{best['is']}`
    because of `{join_and(best['because'])}`,
    even though `{join_and(best['despite'])}` isn't what you want

    The worst option is `{worst['is']}`
    because of `{join_and(worst['because'])}`,
    even though `{join_and(worst['despite'])}` isn't what you want
    """)

def single_line_plot():
    fig, ax = plt.subplots(figsize=(10, 3))
    # Gradient line from blue to red
    x    = np.linspace(0,100, 100)
    y    = np.zeros(100)
    cols = np.linspace(0,1,len(x))

    points = np.array([x, y]).T.reshape((-1, 1, 2))
    segments = np.concatenate([points[:-1], points[1:]], axis=1)

    lc = LineCollection(segments, cmap='Reds')
    lc.set_array(cols)
    lc.set_linewidth(2)
    line = ax.add_collection(lc)
    # fig.colorbar(line,ax=ax)
    # ax.plot([0, 100], [0, 0], color='black')

    ax.set_yticks([])
    ax.set_xticks(range(0, 100, 10), [f"{i}%" for i in range(0, 100, 10)])
    ax.set_xlim(0, 100)
    ax.set_ylim(-1, 1)
    ax.scatter([0, 100] + results.Percentage.tolist(), [0]*(len(results)+2), c=[0, 100] + results.Percentage.tolist(), cmap='Reds')
    for i in range(len(results)):
        ax.text(results.Percentage[i]-1, .05, f'{results.Option[i]} ({results.Percentage[i]:.1f}%)', rotation=44)
    ax.set_ylabel('Perfect')
    ax.set_xlabel("Badness (distance from perfect)")
    st.pyplot(fig)

    with st.expander('Raw Data'):
        st.write(results)

def single_line_plot_plotly():
    ######### Single line plot #########
    t = np.linspace(0, 100, 1000)
    # x, y = t, np.cos(t)
    fig = go.Figure(data=[go.Scatter(
        x = t,
        y = [0]*len(t),
        mode = 'markers',
        marker = dict(
            size = 3,
            color = t,
            colorscale = 'Reds',
            # showscale = False
        ),
        hovertemplate = None,
    )])

    fig.add_trace(go.Scatter(
        x = results.Percentage,
        y = [0]*len(results),
        mode = 'markers',
        marker = dict(
            size = 10,
            color = results.Percentage,
            colorscale = 'Reds',
            cmin = 0,
            cmax = 100,
            showscale = False
        ),
        # text = [f'{option} ({percentage:.1f}%)' for option, percentage in zip(results.Option, results.Percentage)],
        hovertemplate = '%{text}<br>Badness: %{x:.1f}%',
        textposition = 'top center'
    ))

    for i in range(len(results)):
        fig.add_annotation(
            x=results.Percentage[i],
            y=0,
            text=f'{results.Option[i]} ({results.Percentage[i]:.1f}%)',
            showarrow=False,
            font=dict(color="white", size=15),
            # textposition='top',
            # position='top',
            # align='left',
            # valign='bottom',
            xanchor='left',
            yanchor='bottom',
            textangle=-45,
        )

    fig.update_layout(
        xaxis = dict(
            range = [0, 100],
            tickvals = list(range(0, 101, 10)),
            ticktext = [f'{i}%' for i in range(0, 101, 10)]
        ),
        yaxis = dict(
            range = [-1, 1],
            visible = False,
        ),
        height = 300,
        width = 800,
        title = 'Relative distance of each option',
        showlegend=False
    )

    # fig.update_yaxes(range=[-1, 1], showticklabels=False, ticks='')
    fig.add_annotation(
        x=0,
        y=0.1,
        text='Best option',
        showarrow=False,
        font=dict(color="white", size=15),
        textangle=270,
    )

    fig.add_annotation(
        x=100,
        y=0,
        text='Worst option',
        showarrow=False,
        font=dict(color="white", size=15),
        textangle=270,
    )

    st.plotly_chart(fig, use_container_width=True)


def contributions_multiplot():
    ######### Contributions Multiplot #########
    fig, ax = plt.subplots()
    fig, axs = plt.subplots(len(ss.decision.options), 1, figsize=(8, 2*len(ss.decision.options)), sharex=False)
    ax.set_title('Contributions')
    # ax.set_('How much each factor contributed to ')
    for i, ax in enumerate(axs):
        ax.imshow(weighted_delta_vectors_normalized[[i], :], cmap=colorscale)
        for j in range(len(ss.decision.factors)):
            text = ax.text(j, 0, f'{weighted_delta_vectors_normalized[i, j]:.0%}',
                        ha="center", va="center", color="black")
        ax.set_ylabel(ss.decision.options[i])
        ax.set_xticks(range(len(ss.decision.factors)), labels=ss.decision.factors, rotation=0, ha="center", rotation_mode="anchor")
        ax.set_yticks([])

    st.pyplot(fig)

    ######### Contributions Singleplot #########
    with st.expander("bad plot"):
        fig, ax = plt.subplots()
        im = ax.imshow(weighted_delta_vectors_normalized, cmap=colorscale)

        # Show all ticks and label them with the respective list entries
        ax.set_xticks(range(len(ss.decision.factors)), labels=ss.decision.factors,
                    rotation=45, ha="right", rotation_mode="anchor")
        ax.set_yticks(range(len(ss.decision.options)), labels=ss.decision.options)

        # Loop over data dimensions and create text annotations.
        # for i in range(len(ss.decision.factors)):
        #     for j in range(len(ss.decision.options)):
        #         text = ax.text(j, i, f'{weighted_delta_vectors[i, j]:.0%}',
        #                     ha="center", va="center", color="black")

        ax.set_title("This is misleading")
        fig.tight_layout()
        st.pyplot(fig)

# Depricated and broken
def contributions_singleplot():
    colorscale = 'RdYlGn'
    cmin = -1
    cmax = 1
    ######### Contributions Singleplot good #########
    fig, ax = plt.subplots()
    # don't have any gaps
    fig, axs = plt.subplots(2, 2, figsize=(6.5, 1.3*len(ss.decision.options)), sharex=False, sharey=False, gridspec_kw={'wspace': -0.39, 'hspace': -0.39})

    # Initialize the data matrix with zeros
    # data = np.zeros((len(ss.decision.options) + 1, len(ss.decision.factors.columns) + 1))

    # # Fill in the first row with weighted distances
    # data[0, :-1] = ss.decision.weighted_distances
    # # Add average of weighted distances to top-right corner
    # data[0, -1] = np.mean(ss.decision.weighted_distances)

    # # Fill in the main body with normalized contributions
    # data[1:, :-1] = ss.decision.normalized_contributions

    # # Fill in the last column with mean factor relevances
    # data[1:, -1] = ss.decision.mean_factor_relevances
    # st.write(ss.decision.contributions)
    ax = axs[1, 0]
    # data = ss.decision.tiled_weights * (ss.decision.normalized_answers - np.tile(ss.decision.optimal_normalized, (ss.decision.normalized_answers.shape[0], 1))) * -1
    # data = np.abs(ss.decision.tiled_weights * (ss.decision.normalized_answers - np.tile(ss.decision.optimal_normalized, (ss.decision.normalized_answers.shape[0], 1))))

    # length = np.linalg.norm(ss.decision.normalized_answers * ss.decision.tiled_weights)
    # data = np.abs(ss.decision.normalized_answers) / length
    # data /= np.tile(ss.decision.weighted_delta_magnitudes[:, None], (1, len(ss.decision.options)))
    data = ss.decision.weighted_delta_vectors * -1
    im = ax.imshow(data, cmap=colorscale, vmin=cmin, vmax=cmax)
    # Show all ticks and label them with the respective list entries
    ax.set_xticks(range(len(ss.decision.factors)+1), labels=ss.decision.factors.columns.tolist(),
                rotation=45, ha="right", rotation_mode="anchor")
    ax.set_yticks(range(len(ss.decision.options)), labels=ss.decision.options)

    # Loop over data dimensions and create text annotations.
    for i in range(len(ss.decision.factors)):
        for j in range(len(ss.decision.options)):
            text = ax.text(j, i, f'{data[i, j]:.0%}',
                        ha="center", va="center", color="black")

    # ax.set_title("Normalized Contributions")

    ax = axs[0, 0]
    # data = ss.decision.normalized_objective_contributions
    # data = ss.decision.mean_factor_relevances
    # data = ss.decision.mean_factor_relevances
    data = np.mean(data, axis=0)
    ax.imshow(data[:, None].T, cmap='Blues')
    ax.set_yticks([0], labels=[])
    # ax.set_xticks([])
    ax.tick_params(axis='x', bottom=False, top=True, zorder=1)
    ax.set_xticks(range(len(ss.decision.factors)+1), labels=[f'{i:.0%}' for i in ss.decision.weights], zorder=2) # , rotation=0, ha="right", rotation_mode="anchor"
    ax.set_ylabel('Mean Factor Relevances', rotation=0, ha="right", va="center")
    # ax.set_title("Weighted Distances")
    # Add texts
    for i in range(len(ss.decision.options)):
        text = ax.text(i, 0, f'{data[i]:.0%}',
                    ha="center", va="center", color="black")

    ax = axs[1, 1]
    # ax.figsize = (6, 6)
    ax.imshow(ss.decision.normalized_weighted_dists[:, None], cmap='Reds', vmin=0, vmax=1)
    ax.set_yticks([])
    ax.set_xticks([0], labels=[])
    ax.set_xlabel('Weighted Distances', rotation=45, ha="right", va="center", rotation_mode="anchor")
    # ax.set_title("Mean Factor Relevances")
    # Add texts
    for i in range(len(ss.decision.factors)):
        text = ax.text(0, i, f'{ss.decision.normalized_weighted_dists[i]:.0%}',
                    ha="center", va="center", color="black")

    # hide the last cell
    axs[0, 1].set_visible(False)
    # axs[1, 1].set_visible(False)

    fig.tight_layout()
    st.pyplot(fig)


    # st.write(np.sum((ss.decision.tiled_weights)*(ss.decision.normalized_answers - np.tile(ss.decision.optimal_normalized, (ss.decision.normalized_answers.shape[0], 1)))**2, axis=1))

    tiled_optimal = np.tile(ss.decision.optimal_normalized, (ss.decision.normalized_answers.shape[0], 1))
    delta = ss.decision.normalized_answers - tiled_optimal
    # Get the vectors between the 2 points, and weight it
    # This is normalized to be between -1 and 1
    weighted_delta = delta * ss.decision.tiled_weights
    # Compute the magnitude of each of those vectors
    length = np.linalg.norm(weighted_delta, axis=1)
    # Get contribution for each dimension
    contributions = weighted_delta / length[:, None]
    # st.write(contributions)


    st.write(np.sqrt(np.sum(ss.decision.tiled_weights*(delta**2), axis=1)))
    st.write(length)

def contributions_heatmap():
    # Colorscale and range
    colorscale = 'RdYlGn'  # or 'Reds'
    cmin, cmax = -1, 1

    answers = answers

    # Main heatmap data
    # data = (weighted_delta_vectors_normalized * -1) * weighted_delta_magnitudes[:, None]
    data = per_option_contributions * -1
    # data = np.std(answers, axis=0, keepdims=True)
    # data = objective_contributions
    # data = weighted_delta_vectors_normalized * -1
    # data = per_option_contributions * np.tile(weighted_delta_magnitudes[:, None], (1, len(ss.decision.factors.columns)))
    # data = np.flip(data, axis=0)
    row_labels = ss.decision.options
    col_labels = list(ss.decision.factors['names'])

    # top_heatmap_data = mean_factor_relevances[:, None].T * -1
    # top_heatmap_data = np.std(answers, axis=0, keepdims=True)
    top_heatmap_data = np.mean(data, axis=0, keepdims=True)
    # right_heatmap_data = ss.decision.normalized_weighted_dists.reshape(-1, 1)
    right_heatmap_data = (weighted_delta_magnitudes / worst_possible_distance)[:, None]


    # Create subplots with 2 rows and 2 columns
    fig = make_subplots(
        rows=2, cols=2,
        column_widths=[1, 0.2],
        row_heights=[0.2, 0.9],
        horizontal_spacing=0.02,
        vertical_spacing=0.07,
    )

    main_texts = np.char.add(
        np.char.mod('%.0f', data),
            np.char.add('<br>(',
                np.char.add(
                    np.char.add(
                        np.char.add(
                            np.char.mod('%.0f', answers),
                            '/'
                        ),
                        np.char.mod('%.0f', np.tile(ss.decision.maxs, (len(ss.decision.options), 1)))
                    ),
                ')'
            )
        )
    )

    # main_texts = np.char.add('\n(', np.char.add(np.char.mod('%.2f', answers), ')'))
    # main_texts = pd.DataFrame(data).astype(str)
    # main_texts = main_texts + answers.astype(str)
    print(answers)

    # Main heatmap
    heatmap1 = go.Heatmap(
        z=data,
        x=col_labels,
        y=row_labels,
        colorscale=colorscale,
        zmin=cmin,
        zmax=cmax,
        colorbar=dict(
            title="Contribution",
            titleside="right",
            titlefont_size=10,
            thickness=10,
            len=0.8,
            # tickformat='%.0%'
        ),
        text=main_texts,
        texttemplate='%{text}',
        showscale=False
    )

    # Mean values heatmap (top)
    heatmap2 = go.Heatmap(
        z=top_heatmap_data,
        x=col_labels,
        y=['Mean'],
        colorscale=colorscale,
        zmin=cmin,
        zmax=cmax,
        showscale=False,
        text=top_heatmap_data,
        texttemplate='%{text:.2}'
    )

    # Weighted distances heatmap (right)
    heatmap3 = go.Heatmap(
        z=right_heatmap_data,
        x=['Badness'],
        y=row_labels,
        colorscale='Reds',
        zmin=0,
        zmax=1,
        text=right_heatmap_data,
        texttemplate='%{text:.0%}',
        showscale=False
    )

    # Add all heatmaps to the figure
    fig.add_trace(heatmap1, row=2, col=1)
    fig.add_trace(heatmap2, row=1, col=1)
    fig.add_trace(heatmap3, row=2, col=2)

    # Update layout
    fig.update_layout(
        title_text="Contributions",
        title_x=0.4,
        width=800,
        height=400 + 50 * len(ss.decision.options),  # Adjust height based on number of options
        margin=dict(l=100, r=0, t=80, b=0),
        xaxis3=dict(showticklabels=False),
        yaxis4=dict(showticklabels=False)
    )

    # Add weight labels
    for i, weight in enumerate(ss.decision.factors['weights']):
        fig.add_annotation(
            x=col_labels[i],
            y=1.05,  # Position above the top heatmap
            text=f"{weight:.0%}",
            showarrow=False,
            xref="x",
            yref="paper",
            font=dict(size=10)
        )

    # Show the figure
    st.plotly_chart(fig, use_container_width=True)
    # ss.decision.weighted_delta_magnitudes()

def entropy_bar():
    # print(ss.decision.simulation_data.shape)
    # assert ss.decision.simulation_means.shape == ss.decision.weighted_answers(.5).shape, f'{ss.decision.simulation_means.shape} != {ss.decision.weighted_answers(.5).shape}'
    data = pd.DataFrame(
            {
                "Entropy": np.std(answers, axis=0, keepdims=False) * ss.decision.factors['weights'],
            },
            index=ss.decision.factors['names'],
            columns=["Entropy"]
        ).sort_values(by="Entropy", ascending=False)
    fig = px.bar(data, y="Entropy", x=data.index, orientation='v', labels={"Entropy": "How much each factor contributed to the decision", "index": "Factor", "color": "Weight"}, color=ss.decision.factors['weights'], color_continuous_scale='Blues', range_color=[0, 1], title='Usefulness of each factor')
    # Remove the x axis
    fig.update_xaxes(showticklabels=True, showgrid=True)
    st.plotly_chart(fig)


def boxplot():
    fig = px.box(ss.decision.simulation_data)
    st.plotly_chart(fig)


def heatmap_1d():
    l, r = st.columns(2)
    l.dataframe(
        pd.DataFrame(
            {
                "Badness": [worst_possible_distance] + weighted_delta_magnitudes.tolist() + [0],
                "Badness Percentage": np.array([1] + badness.tolist() + [0])*100,
                # "Goodness Percentage": np.array([0] + goodness.tolist() + [1])*100,
            },
            index=['Worst Possible'] + ss.decision.options + ['Theoretical Best'],
            columns=["Badness", "Badness Percentage"]
        )
        .round(2)
        .sort_values(by='Badness Percentage', ascending=True)
        .style.background_gradient(cmap='RdYlGn_r'),
        column_config = {
            "Badness": st.column_config.NumberColumn("Badness", format="%.2f"),
            "Badness Percentage": st.column_config.NumberColumn("Badness Percentage", format="%.0f%%"),
            # "Goodness Percentage": st.column_config.NumberColumn("Goodness Percentage", format="%.0f%%"),
        }
    )
    r.dataframe(
        pd.DataFrame(
            {
                "Goodness Percentage": np.array([0] + goodness.tolist() + [1])*100,
            },
            index=['Worst Possible'] + ss.decision.options + ['Theoretical Best'],
            columns=["Goodness Percentage"]
        )
        .round(2)
        .sort_values(by='Goodness Percentage', ascending=False)
        .style.background_gradient(cmap='RdYlGn'),
        column_config = {
            "Goodness Percentage": st.column_config.NumberColumn("Goodness Percentage", format="%.0f%%"),
        },
        hide_index=True
    )

    # def style(styler):
    #     styler.highlight_null(color='#550000')
    #     styler.apply(lambda x: pd.DataFrame([
    #         ['background-color: yellow' if (i == ss.decision.options[target_index] and j == ss.decision.factors['names'][target_column]) else ''
    #         for j in x.columns]
    #         for i in x.index
    #     ], index=x.index, columns=x.columns), axis=None)
    #     return styler

    # st.dataframe(pd.DataFrame(df, columns=ss.decision.factors['names'], index=ss.decision.options).style.pipe(style))


    # fig = px.imshow(pd.DataFrame(weighted_delta_magnitudes, index=ss.decision.options, columns=ss.decision.factors['names']))
    # st.plotly_chart(fig)

def goodness_bar():
    data = pd.DataFrame(
            {
                "Goodness Percentage":goodness.tolist(),
                "Goodness Confidence":goodness_conf.tolist(),
            },
            index=ss.decision.options,
        ).sort_values(by="Goodness Percentage", ascending=False)
    fig = px.bar(data,
        x=data.index,
        y="Goodness Percentage",
        error_y="Goodness Confidence",
        error_y_minus="Goodness Confidence",
        range_y=[0, 1],
        text="Goodness Percentage",
        title='How good each option is'
    )
    fig.update_yaxes(ticktext=[f'{i:.0f}%' for i in range(0, 101, 10)])
    fig.update_traces(texttemplate='%{text:.0%}')
    fig.update_layout(plot_bgcolor='#262730')
    fig.update_yaxes(tickformat='.0%')

    st.plotly_chart(fig)

@st.cache_data
def plot_pca(X, labels):
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(X)
    fig = px.scatter(x=X_pca[:,0], y=X_pca[:,1], text=labels, title='Visualizing the options')#, error_x=normalized_answers_conf.tolist() + [0, 0], error_y=normalized_answers_conf.tolist() + [0, 0])
    fig.add_shape(type='line', x0=X_pca[-1,0], y0=X_pca[-1,1], x1=X_pca[-2,0], y1=X_pca[-2,1], line_color='white')
    fig.update_traces(textposition='top center')
    fig.update_layout(xaxis=None, yaxis=None, showlegend=False)
    fig.update_yaxes(showticklabels=False)
    fig.update_xaxes(showticklabels=False)
    # Draw a line from the optimal to the worst
    # print(X_pca)
    st.plotly_chart(fig)

# Works just as good as PCA and MDS, they're all arbitrary. I went with PCA
# @st.cache_data
# def plot_umap(X, labels):
    # reducer = umap.UMAP(n_neighbors=3, min_dist=0.1, metric='euclidean')
    # X_umap = reducer.fit_transform(X)
    # fig = px.scatter(x=X_umap[:,0], y=X_umap[:,1], text=labels, title='UMAP Projection')
    # fig.update_traces(textposition='top center')
    # st.plotly_chart(fig)


# This comparse options to each other: I don't particularly care about that
# @st.cache_data
# def plot_distance_matrix(X, labels):
    # dist_matrix = pairwise_distances(X)
    # # Round to 2 decimal places
    # dist_matrix = np.round(dist_matrix, 1)
    # fig = ff.create_annotated_heatmap(z=dist_matrix, x=labels, y=labels, colorscale='Reds')
    # fig.update_layout(title='Pairwise Distance Heatmap')
    # st.plotly_chart(fig)


# Basically an inverted copy of PCA, as far as I can tell. Good, but just as arbitrary as UMAP and PCA
# @st.cache_data
# def plot_mds(X, labels):
    # mds = MDS(n_components=2, dissimilarity='euclidean', random_state=0)
    # X_mds = mds.fit_transform(X)
    # fig = px.scatter(x=X_mds[:,0], y=X_mds[:,1], text=labels, title='MDS Projection')
    # fig.update_traces(textposition='top center')
    # st.plotly_chart(fig)


# This one is too hard to parse, too much going on
# @st.cache_data
# def plot_parallel_coordinates(X, labels):
    # df = pd.DataFrame(X, columns=[f'Dim{i}' for i in range(X.shape[1])])
    # df['Label'] = labels
    # fig = px.parallel_coordinates(df, title='Parallel Coordinates Plot')
    # st.plotly_chart(fig)

graph_idx = 0
def explain(text, spec=[1, .0001]):
    global graph_idx
    l, r = st.columns(spec)
    with r.popover(label='', icon='❔'):
        st.caption(text)
    r.caption(ascii_uppercase[graph_idx])
    graph_idx += 1
    return l

@st.cache_data
def plot_radar(X, labels):
    num_vars = X.shape[1]
    angles = np.linspace(0, 2 * np.pi, num_vars, endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(6,6), subplot_kw=dict(polar=True))

    for i in range(len(X)):
        values = X[i].tolist()
        values += values[:1]
        ax.plot(angles, values, label=labels[i])
        ax.fill(angles, values, alpha=0.1)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels([f'Dim{i}' for i in range(num_vars)])
    ax.set_title('Radar Chart')
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1))
    st.pyplot(fig)


@st.cache_data
def plot_radar_polar_single(X, labels, dim_labels):
    df = pd.DataFrame(dict(
        r=X[0],
        theta=dim_labels))
    fig = px.line_polar(df, r='r', theta='theta', line_close=True, title=labels[0])
    fig.update_traces(fill='toself')
    fig.update_layout(showlegend=True)
    st.plotly_chart(fig)

def plot_radar_polar(X, labels, dim_labels):
    # Rearrange the dimensions by sorting the optimal answer
    optimal = X[-2]
    sorted_indices = np.argsort(optimal)
    dim_labels = np.array(dim_labels)[sorted_indices]
    X = X[:, sorted_indices]
    # By default, include the optimal answer, and the best option
    include = st.pills('Options', labels, default=[labels[-2]], selection_mode='multi')
    fig = go.Figure()
    for i in range(len(X)):
        if labels[i] not in include:
            continue
        fig.add_trace(go.Scatterpolar(
            r=X[i].tolist() + [X[i][0]],
            theta=dim_labels.tolist() + [dim_labels[0]],
            fill='toself',
            name=labels[i]))

    fig.update_layout(
    polar=dict(
        radialaxis=dict(
        visible=True,
        range=[0, 1]
        )),
    showlegend=True
    )

    st.plotly_chart(fig)






""" # Results """
results_explanation()



with explain(ss.texts['view_results']['goodness_bar']):
    goodness_bar()

""" ## Here's how much each factor contributed to that result: """
with explain(ss.texts['view_results']['entropy']):
    entropy_bar()

""" ## Additional visualizations """
with explain(ss.texts['view_results']['heatmap1d']):
    heatmap_1d()

# Shows stuff in the sidebar
# internals()



with explain(ss.texts['view_results']['line1d']):
    # single_line_plot()
    single_line_plot_plotly()
# with r:
#     explain(ss.texts['view_results']['contributions'])

# contributions_multiplot()
# contributions_singleplot()
# contributions_heatmap()
# boxplot()

data = normalized_answers
# Add the optimal and the worst possible answers as vectors

data = np.vstack((data, optimal_normalized, worst_possible_option_normalized))
labels = ss.decision.options + ['Best'] + ['Worst']
# st.dataframe(pd.DataFrame(data, index=labels))
with explain(ss.texts['view_results']['PCA']):
    plot_pca(data, labels)
# plot_mds(data, labels)
# plot_umap(data, labels)
# plot_distance_matrix(data, labels)
# plot_parallel_coordinates(data, labels)
# plot_radar(data, labels)
with explain(ss.texts['view_results']['radar']):
    plot_radar_polar(data, labels, ss.decision.factors['names'])


# contributions_heatmap()
# contributions_multiplot()
# boxplot()