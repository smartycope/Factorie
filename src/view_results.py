import re
from typing import Literal

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

# ss.factors
# ss.answers
# colorscale = 'YlOrRd'
colorscale = 'Reds'
# norm=plt.Normalize(-2,2)
# colorscale = matplotlib.colors.LinearSegmentedColormap.from_list("", ["white","red"])



def internals():
    with st.sidebar:
        with st.expander("parsed_values"):
            st.write(ss.decision.answers.values(ss.decision.optimism))

        with st.expander("parsed_stds"):
            st.write(ss.decision.answers.stds)

        with st.expander("mins"):
            st.write(ss.decision.mins)

        with st.expander("maxs"):
            st.write(ss.decision.maxs)

        with st.expander("optimal normalized"):
            st.write(ss.decision.optimal_normalized)

        with st.expander("normalized answers"):
            st.write(ss.decision.normalized_answers)

        with st.expander("contributions"):
            st.write(ss.decision.contributions)

        with st.expander("sums"):
            st.write(ss.decision.sums)

        with st.expander("weighted_dists"):
            st.write(ss.decision.weighted_distances)

        with st.expander("normalized_contributions"):
            st.write(ss.decision.normalized_contributions)

        with st.expander("mean_factor_relevance"):
            st.write(ss.decision.mean_factor_relevances)

        with st.expander("best_worst_options_extremes"):
            st.write(ss.decision.best_worst_options())

        with st.expander("best_worst_options_threshold"):
            st.write(ss.decision.best_worst_options(method='threshold'))

        with st.expander("worst_possible"):
            st.write(ss.decision.worst_possible)

        with st.expander('normalized_weighted_dists'):
            st.write(ss.decision.normalized_weighted_dists)

def results_explanation():
    results = pd.DataFrame({
        'Score': ss.decision.normalized_weighted_dists(),
        'Option': ss.decision.options,
        'Percentage': ss.decision.normalized_weighted_dists()*100})\
    .sort_values(by='Score', ascending=True).reset_index(drop=True)

    bw = ss.decision.best_worst_options(method='threshold')
    st.write(f"""
    The best option is `{bw['best']['is']}`
    because of `{', '.join(bw['best']['because'])}`,
    even though `{', '.join(bw['best']['despite'])}` isn't what you want

    The worst option is `{bw['worst']['is']}`
    because of `{', '.join(bw['worst']['because'])}`,
    even though `{', '.join(bw['worst']['despite'])}` isn't what you want
    """)

    ######### Single line plot #########
    fig, ax = plt.subplots(figsize=(10, 3))
    # Gradient line from blue to red
    x    = np.linspace(0,100, 100)
    y    = np.zeros(100)
    cols = np.linspace(0,1,len(x))

    points = np.array([x, y]).T.reshape(-1, 1, 2)
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



    ######### Contributions Multiplot #########
    fig, ax = plt.subplots()
    fig, axs = plt.subplots(len(ss.decision.options), 1, figsize=(8, 2*len(ss.decision.options)), sharex=False)
    ax.set_title('Contributions')
    # ax.set_('How much each factor contributed to ')
    for i, ax in enumerate(axs):
        ax.imshow(ss.decision.weighted_delta_vectors()[[i], :], cmap=colorscale)
        for j in range(len(ss.decision.factors)):
            text = ax.text(j, 0, f'{ss.decision.weighted_delta_vectors()[i, j]:.0%}',
                        ha="center", va="center", color="black")
        ax.set_ylabel(ss.decision.options[i])
        ax.set_xticks(range(len(ss.decision.factors)), labels=ss.decision.factors, rotation=0, ha="center", rotation_mode="anchor")
        ax.set_yticks([])

    st.pyplot(fig)

    ######### Contributions Singleplot #########
    with st.expander("bad plot"):
        fig, ax = plt.subplots()
        im = ax.imshow(ss.decision.weighted_delta_vectors(), cmap=colorscale)

        # Show all ticks and label them with the respective list entries
        ax.set_xticks(range(len(ss.decision.factors)), labels=ss.decision.factors,
                    rotation=45, ha="right", rotation_mode="anchor")
        ax.set_yticks(range(len(ss.decision.options)), labels=ss.decision.options)

        # Loop over data dimensions and create text annotations.
        # for i in range(len(ss.decision.factors)):
        #     for j in range(len(ss.decision.options)):
        #         text = ax.text(j, i, f'{ss.decision.weighted_delta_vectors()[i, j]:.0%}',
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

    # Main heatmap data
    data = (ss.decision.weighted_delta_vectors() * -1) * ss.decision.weighted_delta_magnitudes()[:, None]
    # data = ss.decision.per_option_contributions  * -1
    # data = ss.decision.weighted_delta_vectors * -1
    # data = ss.decision.per_option_contributions * np.tile(ss.decision.weighted_delta_magnitudes[:, None], (1, len(ss.decision.factors.columns)))
    # data = np.flip(data, axis=0)
    row_labels = ss.decision.options
    col_labels = list(ss.decision.factors.keys())

    top_heatmap_data = ss.decision.mean_factor_relevances()[:, None].T * -1
    # top_heatmap_data = np.mean(data, axis=0, keepdims=True)
    # right_heatmap_data = ss.decision.normalized_weighted_dists.reshape(-1, 1)
    right_heatmap_data = (ss.decision.weighted_delta_magnitudes() / ss.decision.worst_possible_magnitude)[:, None]


    # Create subplots with 2 rows and 2 columns
    fig = make_subplots(
        rows=2, cols=2,
        column_widths=[1, 0.2],
        row_heights=[0.2, 0.9],
        horizontal_spacing=0.02,
        vertical_spacing=0.07,
    )

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
        text=data,
        texttemplate='%{text:.0%}',
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
        texttemplate='%{text:.0%}'
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


def boxplot():
    # st.dataframe(ss.decision.monte_carlo(100))
    @st.cache_data
    def monte_carlo(n):
        return pd.DataFrame(ss.decision.monte_carlo(n), columns=ss.decision.options)

    fig = px.box(monte_carlo(100), points='all')
    st.plotly_chart(fig)

# internals()
results_explanation()
# contributions_singleplot()
# contributions_heatmap()
# boxplot()
