import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st
from plotly.colors import sample_colorscale
from sklearn.decomposition import PCA
from streamlit import session_state as ss

colorscale = "Reds"


with st.spinner("Calculating..."):
    calc = ss.decisions[ss.decisions.index(ss.decision)].calculate_all(
        method="threshold"
    )

# 1D array of shape (num_factors,) of the values we *want* each factor to have
optimal_normalized = ss.decision.optimal_normalized
# The worst possible option. The best possible option is always going to be 0
# Because it's normalized, we can simply round to the nearest extreme, and flip it (0 -> 1, 1 -> 0, .75 -> 0)
worst_possible_option_normalized = ss.decision.worst_possible_option_normalized
# The distance between the worst possible option and the optimal
worst_possible_distance = ss.decision.worst_possible_distance
# The answers normalized to the range [0, 1]
normalized_answers = calc["mean"]["normalized_answers"]
normalized_answers_conf = calc["std"]["normalized_answers"]
# The distance between each option and the optimal
delta_vectors_normalized = calc["mean"]["delta_vectors_normalized"]
delta_vectors_normalized_conf = calc["std"]["delta_vectors_normalized"]
# The weighted delta vector between each option and the optimal
weighted_delta_vectors_normalized = calc["mean"]["weighted_delta_vectors_normalized"]
weighted_delta_vectors_normalized_conf = calc["std"]["weighted_delta_vectors_normalized"]
# The magnitudes of the weighted delta vectors between each option and the optimal
weighted_delta_magnitudes = calc["mean"]["weighted_delta_magnitudes"]
weighted_delta_magnitudes_conf = calc["std"]["weighted_delta_magnitudes"]
# A percentage of how much each factor contributed to the total distance between the optimal and each option
# This is really num_options seperate vectors, but they're together for convenience
# The sign indicates whether it was towrds or away from the optimal. Take the absolute value for the plain contribution
per_option_contributions = calc["mean"]["per_option_contributions"]
per_option_contributions_conf = calc["std"]["per_option_contributions"]
# A percentage of how much each factor contributed to the distance from the optimal, divided by each option's distance
# I'm not sure how useful this is: probably just use per_option_contributions or weighted_delta_vectors instead
objective_contributions = calc["mean"]["objective_contributions"]
objective_contributions_conf = calc["std"]["objective_contributions"]
# The average percentage of how much each factor deviates from the optimal
mean_factor_relevances = calc["mean"]["mean_factor_relevances"]
mean_factor_relevances_conf = calc["std"]["mean_factor_relevances"]
# The normalized weighted distances between each option and the optimal
normalized_weighted_dists = badness = calc["mean"]["badness"]
normalized_weighted_dists_conf = badness_conf = calc["std"]["badness"]
# Inverse of the above, so that higher is better
inverted_normalized_weighted_dists = goodness = calc["mean"]["goodness"]
inverted_normalized_weighted_dists_conf = goodness_conf = calc["std"]["goodness"]
best = calc["best"]
worst = calc["worst"]
# 2 dimensional array of the answers, with shape (num_options, num_factors)
answers = ss.decision.weighted_answers(0.5)
# Decision.mins & Decision.maxs are 1d arrays of the mins and maxs for each factor, with shape (num_factors,)

results = (
    pd.DataFrame(
        {
            "Score": normalized_weighted_dists,
            "Option": ss.decision.options,
            "Percentage": normalized_weighted_dists * 100,
        }
    )
    .sort_values(by="Score", ascending=True)
    .reset_index(drop=True)
)


def join_and(items, oxford=False, ampersand=False):
    and_ = " & " if ampersand else " and "
    if oxford:
        and_ = "," + and_
    if len(items) == 1:
        return items[0]
    elif len(items) == 2:
        return and_.join(items)
    else:
        return ", ".join(items[:-1]) + and_ + items[-1]


def results_explanation():
    st.write(
        f"""
    The best option is `{best['is']}`
    because of `{join_and(best['because'])}`,
    even though `{join_and(best['despite'])}` isn't what you want

    The worst option is `{worst['is']}`
    because of `{join_and(worst['because'])}`,
    even though `{join_and(worst['despite'])}` is what you want
    """
    )


def single_line_plot_plotly():
    ######### Single line plot #########
    t = np.linspace(0, 100, 1000)
    fig = go.Figure(
        data=[
            go.Scatter(
                x=t,
                y=[0] * len(t),
                mode="markers",
                marker=dict(
                    size=3,
                    color=t,
                    colorscale="Reds",
                ),
                hovertemplate=None,
            )
        ]
    )

    fig.add_trace(
        go.Scatter(
            x=results.Percentage,
            y=[0] * len(results),
            mode="markers",
            marker=dict(
                size=10,
                color=results.Percentage,
                colorscale="Reds",
                cmin=0,
                cmax=100,
                showscale=False,
            ),
            hovertemplate="%{text}<br>Badness: %{x:.1f}%",
            textposition="top center",
        )
    )

    for i in range(len(results)):
        fig.add_annotation(
            x=results.Percentage[i],
            y=0,
            text=f"{results.Option[i]} ({results.Percentage[i]:.1f}%)",
            showarrow=False,
            font=dict(color=st.get_option("theme.textColor"), size=15),
            xanchor="left",
            yanchor="bottom",
            textangle=-45,
        )

    fig.update_layout(
        xaxis=dict(
            range=[0, 100],
            tickvals=list(range(0, 101, 10)),
            ticktext=[f"{i}%" for i in range(0, 101, 10)],
        ),
        yaxis=dict(
            range=[-1, 1],
            visible=False,
        ),
        height=300,
        width=800,
        title="Relative distance of each option",
        showlegend=False,
    )

    fig.add_annotation(
        x=0,
        y=0.1,
        text="Best option",
        showarrow=False,
        font=dict(color=st.get_option("theme.textColor"), size=15),
        textangle=270,
    )

    fig.add_annotation(
        x=100,
        y=0,
        text="Worst option",
        showarrow=False,
        font=dict(color=st.get_option("theme.textColor"), size=15),
        textangle=270,
    )

    st.plotly_chart(fig, use_container_width=True)


def contributions_heatmap_variable_sizes(data1=True):
    tiled_weights = np.tile(
        ss.decision.factors["weights"], (len(ss.decision.options), 1)
    )
    # Colorscale and range
    # yellow is better here, because the middle value (50% in this case) isn't actually significant
    colorscale = ["#9B1127", "#FFFFBF", "#195695"]
    cmin, cmax = 0, 1
    background = st.get_option("theme.primaryColor")
    opposite_bg_color = st.get_option("theme.textColor")

    # The abs is because 0 is the best, and if it's non-zero in either direction, + or -, it's still
    # further away from the optimal.
    # The 1- is because it's in terms of "badness" (distance from optimal), whereas
    # "goodness" (distance from worst) is easier to conceptualize
    if data1:
        data = 1 - np.abs(delta_vectors_normalized)
    else:
        tiled_weights = np.tile(
            ss.decision.factors["weights"], (len(ss.decision.options), 1)
        )
        data = (1 - np.abs(delta_vectors_normalized)) * tiled_weights
    data *= 100

    # Main heatmap data
    row_labels = ss.decision.options
    col_labels = list(ss.decision.factors["names"])

    main_texts = np.char.add(
        np.char.mod("%.0f", data),
        np.char.add(
            "%<br>(",
            np.char.add(
                np.char.add(
                    np.char.add(np.char.mod("%.0f", answers), "/"),
                    np.char.mod(
                        "%.0f", np.tile(ss.decision.maxs, (len(ss.decision.options), 1))
                    ),
                ),
                ")",
            ),
        ),
    )

    heatmap1 = go.Figure()

    # Parameters
    n_rows, n_cols = data.shape
    cell_width = 1
    cell_height = 1

    # Loop through data and draw rectangles
    for i in range(n_rows):
        for j in range(n_cols):
            fillcolor = sample_colorscale(
                colorscale, abs(data[i][j]) / 100, low=cmin, high=cmax
            )[0]

            weight = tiled_weights[i][j]
            cx = j
            cy = i

            # Calculate size
            half_w = (cell_width * weight) / 2
            half_h = (cell_height * weight) / 2

            # Draw the heatmap cell as a shape
            heatmap1.add_shape(
                type="rect",
                x0=cx - half_w,
                y0=cy - half_h,
                x1=cx + half_w,
                y1=cy + half_h,
                line=dict(width=0),
                fillcolor=fillcolor,
                layer="below",
            )

            # Add text label
            heatmap1.add_trace(
                go.Scatter(
                    x=[cx],
                    y=[cy],
                    text=[main_texts[i][j]],
                    mode="text",
                    textfont=dict(
                        color="black" if weight > 0.3 else opposite_bg_color, size=12
                    ),
                    hoverinfo="skip",
                    showlegend=False,
                )
            )

    # Update layout
    m = 20
    heatmap1.update_layout(
        xaxis=dict(
            tickvals=list(range(n_cols)),
            ticktext=col_labels,
            showgrid=False,
            zeroline=False,
            scaleanchor="y",
        ),
        yaxis=dict(
            tickvals=list(range(n_rows)),
            ticktext=row_labels,  # [::-1],
            showgrid=False,
            zeroline=False,
            autorange="reversed",
        ),
        # The center color
        plot_bgcolor=background,
        margin=dict(t=m * 2, b=m, l=m, r=m),
        title="How good each option is",
        title_x=0.2,
        title_font_size=20,
    )

    st.plotly_chart(heatmap1)
    return


def entropy_bar():
    data = pd.DataFrame(
        {
            "Entropy": np.std(answers, axis=0, keepdims=False)
            * ss.decision.factors["weights"],
        },
        index=ss.decision.factors["names"],
        columns=["Entropy"],
    ).sort_values(by="Entropy", ascending=False)
    fig = px.bar(
        data,
        y="Entropy",
        x=data.index,
        orientation="v",
        labels={
            "Entropy": "How much each factor contributed to the decision",
            "index": "Factor",
            "color": "Weight",
        },
        color=ss.decision.factors["weights"],
        color_continuous_scale="Blues",
        range_color=[0, 1],
        title="Usefulness of each factor",
    )
    # Remove the x axis
    fig.update_xaxes(showticklabels=True, showgrid=True)
    st.plotly_chart(fig)


def goodness_bar():
    data = pd.DataFrame(
        {
            "Goodness Percentage": goodness.tolist(),
            "Goodness Confidence": goodness_conf.tolist(),
        },
        index=ss.decision.options,
    ).sort_values(by="Goodness Percentage", ascending=False)
    fig = px.bar(
        data,
        x=data.index,
        y="Goodness Percentage",
        error_y="Goodness Confidence",
        error_y_minus="Goodness Confidence",
        range_y=[0, 1],
        text="Goodness Percentage",
        title="How good each option is",
    )
    fig.update_yaxes(ticktext=[f"{i:.0f}%" for i in range(0, 101, 10)])
    fig.update_traces(texttemplate="%{text:.0%}")
    fig.update_yaxes(tickformat=".0%")

    st.plotly_chart(fig)


def get_pca(X):
    pca = PCA(n_components=2)
    return pca.fit_transform(X)


def plot_pca(X, labels):
    X_pca = get_pca(X)
    fig = px.scatter(
        x=X_pca[:, 0], y=X_pca[:, 1], text=labels, title="Visualizing the options"
    )
    fig.add_shape(
        type="line",
        x0=X_pca[-1, 0],
        y0=X_pca[-1, 1],
        x1=X_pca[-2, 0],
        y1=X_pca[-2, 1],
        line_color="blue",
    )
    fig.update_traces(textposition="top center")
    fig.update_layout(xaxis=None, yaxis=None, showlegend=False)
    fig.update_yaxes(showticklabels=False)
    fig.update_xaxes(showticklabels=False)
    st.plotly_chart(fig)


def plot_radar_polar(X, labels, dim_labels):
    # Rearrange the dimensions by sorting the optimal answer
    optimal = X[-2]
    sorted_indices = np.argsort(optimal)
    dim_labels = np.array(dim_labels)[sorted_indices]
    X = X[:, sorted_indices]
    # By default, include the optimal answer, andthe best option
    best_idx = labels.index(best["is"])
    include = st.pills(
        "Options",
        labels,
        default=[labels[-2], labels[best_idx]],
        selection_mode="multi",
    )
    fig = go.Figure()
    for i in range(len(X)):
        if labels[i] not in include:
            continue
        fig.add_trace(
            go.Scatterpolar(
                r=X[i].tolist() + [X[i][0]],
                theta=dim_labels.tolist() + [dim_labels[0]],
                fill="toself",
                name=labels[i],
            )
        )

    fig.update_layout(
        polar=dict(radialaxis=dict(visible=True, range=[0, 1])), showlegend=True
    )

    st.plotly_chart(fig)


goodness_bar()
entropy_bar()
contributions_heatmap_variable_sizes()
single_line_plot_plotly()

data = normalized_answers
# Add the optimal and the worst possible answers as vectors
data = np.vstack((data, optimal_normalized, worst_possible_option_normalized))
labels = ss.decision.options + ["Best"] + ["Worst"]
plot_pca(data, labels)
plot_radar_polar(data, labels, ss.decision.factors["names"])
