import os
import streamlit.components.v1 as components
from typing import Literal

# Create a _RELEASE constant. We'll set this to False while we're developing
# the component, and True when we're ready to package and distribute it.
# (This is, of course, optional - there are innumerable ways to manage your
# release process.)
_RELEASE = False

# Declare a Streamlit component. `declare_component` returns a function
# that is used to create instances of the component. We're naming this
# function "_component_func", with an underscore prefix, because we don't want
# to expose it directly to users. Instead, we will create a custom wrapper
# function, below, that will serve as our component's public API.

# It's worth noting that this call to `declare_component` is the
# *only thing* you need to do to create the binding between Streamlit and
# your component frontend. Everything else we do in this file is simply a
# best practice.

if not _RELEASE:
    _component_func = components.declare_component(
        # We give the component a simple, descriptive name ("my_component"
        # does not fit this bill, so please choose something better for your
        # own component :)
        "multi_handled_slider",
        # Pass `url` here to tell Streamlit that the component will be served
        # by the local dev server that you run via `npm run start`.
        # (This is useful while your component is in development.)
        url="http://localhost:3001",
    )
else:
    # When we're distributing a production version of the component, we'll
    # replace the `url` param with `path`, and point it to the component's
    # build directory:
    parent_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(parent_dir, "frontend/build")
    _component_func = components.declare_component("multi_handled_slider", path=build_dir)


# Create a wrapper function for the component. This is an optional
# best practice - we could simply expose the component function returned by
# `declare_component` and call it done. The wrapper allows us to customize
# our component's API: we can pre-process its input args, post-process its
# output value, and add a docstring for users.
def multi_handled_slider(
    starting_values,
    names=None,
    gradient=['#000000', '#ffffff'],
    overlap: Literal['push', 'block', 'allow'] = 'push',
    start_text=None,
    end_text=None,
    show_values=False,
    digits=1,
    multiplier=1,
    prefix='',
    sep=' ',
    suffix='',
    step=None,
    label_pos: Literal['top', 'bottom'] ='top',
    label_rotation=0,
    height=None,
    continuous_update=False,
    key=None,
):
    """Create a new instance of "multi_handled_slider".

    Parameters
    ----------
    values: a list of all the values of the component
    names: an optional list of the same length as values, which if specified, adds labels to each handle
    gradient: a list of colors which specify a color gradient for the slider. The handles should dynamically set their color to be in line with this color gradient, based on their value
    overlap: if 'allow', allows handles to pass each other. If 'block', handles can't pass each other, and you have to move one at a time. If 'push', handles will push each other out of the way when they overlap.
    start_text: an optional string specifying text to go at the start
    end_text: an optional string specifying text to go at the end
    show_values: a bool that, if true, puts the values in text next to the handle names
    digits: an int that specifies how many decimal places to show for the values
    multiplier: a float that multiplies the values before displaying them
    prefix: a string that goes before the values
    suffix: a string that goes after the values
    step: an optional step size for the slider
    label_pos: a string that specifies the position of the labels ('top' or 'bottom')
    label_rotation: an int that specifies the rotation of the labels (in degrees)
    continuous_update: a bool that, if true, updates the component value every time a handle is moved, not just when released

    Returns
    -------
    list
        The list of values of the handles.
    """

    # If they're still out of bounds, raise an error
    if not all(0 <= v <= 1 for v in starting_values):
        raise ValueError("All values must be in the range [0,1]")

    component_value = _component_func(
        values=starting_values,
        names=names,
        gradient=gradient,
        overlap=overlap,
        startText=start_text,
        endText=end_text,
        showValues=show_values,
        digits=digits,
        multiplier=multiplier,
        prefix=prefix,
        sep=sep,
        suffix=suffix,
        step=step,
        labelPos=label_pos,
        labelRotation=label_rotation,
        default=starting_values,
        key=key,
        height=height,
        continuousUpdate=continuous_update,
    )

    # We could modify the value returned from the component if we wanted.
    # There's no need to do this in our simple example - but it's an option.
    return component_value
