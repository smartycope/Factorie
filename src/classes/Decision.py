import pandas as pd
import re
import numpy as np
from typing import Dict, List, Any, Union, Tuple, Literal
from src.classes.FactorPack import FactorPack

# Define a type alias for the factor dictionary structure
tiny = np.finfo(np.float64).tiny

def require_valid(func):
    def wrapper(self, *args, **kwargs):
        if (msg := self.is_invalid()):
            raise ValueError(msg)
        else:
            return func(self, *args, **kwargs)
    return wrapper

class Decision:
    """ All of the members of this class are readonly, don't modify them (outside of the class code itself) """
    def __init__(self, name:str):
        self.name = name
        self._factors = {
            'names': [],
            'units': [],
            'optimals': [],
            'weights': [],
            'mins': [],
            'maxs': [],
        }
        self.options = []
        # an array of shape (num_options, num_factors, 2), where the second dimension is [min, max]
        self.answers = np.full((0, 0, 2), np.nan)
        self.threshold = 0
        self.factor_packs = []

    def is_invalid(self):
        """ Returns None if valid, or a string explaining why it's invalid
            Note that none of the methods called here can use require_valid, or else we'll get a RecursionError
        """
        # There need to be some factors
        if not self._factors['names']:
            return "No factors added"
        # There need to be some options
        if not self.options:
            return "No options added"
        # The answers need to have the correct shape, and be filled
        if self.answers.shape[0] != len(self.options):
            return "Answers do not match options"
        if self.answers.shape[1] != len(self._factors['names']):
            return "Answers do not match factors"
        if self.answers.shape[2] != 2:
            return "Answers do not match answers"
        if np.isnan(self.answers).any():
            return "Not all answers are filled"
        # Factor optimals and weights must all be non-None
        # Factor maxs and mins actually can be None
        if None in self._factors['optimals'] or None in self._factors['weights']:
            return "All factors must have an optimal and weight"
        # Mins must be less than maxs
        if np.any(self.maxs < self.mins):
            return "All factors must have a min less than max"
        # Make sure all the weights are between 0 and 1
        if np.any(self.weights < 0) or np.any(self.weights > 1):
            return "All factors must have a weight between 0 and 1"
        return None

    def add_factor_pack(self, factor_pack:FactorPack):
        self.factor_packs.append(factor_pack)

    def remove_factor_pack(self, factor_pack:FactorPack):
        self.factor_packs.remove(factor_pack)

    def apply_factor_pack(self, factor_pack:FactorPack):
        for factor in factor_pack.factors:
            self.add_factor(factor['name'])

    @property
    def factors(self):
        return self._factors

    def add_factor(self, name:str, unit:str=None, optimal:float=None, weight:float=None, min:float=None, max:float=None):
        """ weight should be between 0 and 1. Optimal, min, and max can be on the user's scale """
        # Ensure that the name is unique
        if name in self._factors['names']:
            raise ValueError(f"Factor {name} already exists")
        self._factors['names'].append(name)
        self._factors['units'].append(unit)
        self._factors['optimals'].append(optimal)
        self._factors['weights'].append(weight)
        self._factors['mins'].append(min)
        self._factors['maxs'].append(max)
        self.answers = np.append(self.answers, np.full((len(self.options), 1, 2), np.nan), axis=1)

    def edit_factor(self, name:str, unit:str=None, optimal:float=None, weight:float=None, min:float=None, max:float=None):
        """ To modify the name, use edit_factor_name instead """
        idx = self._factors['names'].index(name)
        self._factors['units'][idx] = unit or self._factors['units'][idx]
        self._factors['optimals'][idx] = optimal or self._factors['optimals'][idx]
        self._factors['weights'][idx] = weight or self._factors['weights'][idx]
        # Because these can be None, if they're specified here, set them. We want to be able to set to None after setting to a value
        self._factors['mins'][idx] = min
        self._factors['maxs'][idx] = max

    def remove_factor(self, name:str):
        idx = self._factors['names'].index(name)
        self._factors['names'].pop(idx)
        self._factors['units'].pop(idx)
        self._factors['optimals'].pop(idx)
        self._factors['weights'].pop(idx)
        self._factors['mins'].pop(idx)
        self._factors['maxs'].pop(idx)
        self.answers = np.delete(self.answers, idx, axis=1)

    def remove_option(self, name:str):
        idx = self.options.index(name)
        self.options.pop(idx)
        self.answers = np.delete(self.answers, idx, axis=0)

    def clear_answer(self, option:str, factor:str):
        self.answers[self.options.index(option), self._factors['names'].index(factor), :] = np.nan

    def clear_answers_for_option(self, option:str):
        self.answers[self.options.index(option), :, :] = np.nan

    def clear_answers_for_factor(self, factor:str):
        self.answers[:, self._factors['names'].index(factor), :] = np.nan

    def clear_all_answers(self):
        self.answers = np.full((len(self.options), len(self._factors['names']), 2), np.nan)

    def edit_factor_name(self, old_name:str, new_name:str):
        idx = self._factors['names'].index(old_name)
        self._factors['names'][idx] = new_name

    def add_answer(self, option:str, factor:str, answer:str):
        m = re.match(r'((?:(?:\-|\+))?\d+(?:\.\d+)?)(?:(?:\s+)?\-(?:\s+)?((?:(?:\-|\+))?\d+(?:\.\d+)?))?', answer)
        if m:
            self.answers[self.options.index(option), self._factors['names'].index(factor), 0] = float(m.group(1))
            self.answers[self.options.index(option), self._factors['names'].index(factor), 1] = float(m.group(2)) if m.group(2) else float(m.group(1))
        else:
            raise ValueError(f"Invalid answer: {answer}")

    def add_option(self, option:str):
        self.options.append(option)
        self.answers = np.append(self.answers, np.full((1, len(self._factors['names']), 2), np.nan), axis=0)

    def weighted_answers(self, optimism:float):
        return self.min_answers + (self.max_answers - self.min_answers)*optimism

    @property
    @require_valid
    def std_answers(self):
        return (self.max_answers - self.min_answers)/2

    @property
    @require_valid
    def min_answers(self):
        return self.answers[:, :, 0]

    @property
    @require_valid
    def max_answers(self):
        return self.answers[:, :, 1]

    @property
    def mins(self):
        """ If no min specified, use the minimum from answers or optimal value """
        return np.array([
                (
                    self._factors['mins'][i]
                    if self._factors['mins'][i] is not None
                    else min(self.answers[:, i, 0].min(),
                            self._factors['optimals'][i])
                )
                for i in range(len(self._factors['names']))
            ])

    @property
    def maxs(self):
        """ If no max specified, use the maximum from answers or optimal value"""
        return np.array([
                (
                    self._factors['maxs'][i]
                    if self._factors['maxs'][i] is not None
                    else max(self.answers[:, i, 1].max(),
                            self._factors['optimals'][i])
                )
                for i in range(len(self._factors['names']))
            ])

    @require_valid
    def calculate(self, answers=None):
        if answers is None:
            answers = self.weighted_answers(.5)

        # The optimal option normalized to the range [0, 1]
        # + tiny to avoid division by zero
        optimal_normalized = (self.factors['optimals'] - self.mins) / (self.maxs - self.mins + tiny)

        # The worst possible option. The best possible option is always going to be 0
        # Because it's normalized, we can simply round to the nearest extreme, and flip it (0 -> 1, 1 -> 0, .75 -> 0)
        worst_possible_option_normalized = ~optimal_normalized.round().astype(bool)

        # The distance between the worst possible option and the optimal
        worst_possible_distance = np.linalg.norm(worst_possible_option_normalized - optimal_normalized)

        # Tile weights to match the shape of options
        tiled_weights = np.tile(self.factors['weights'], (len(self.options), 1))

        # Tile normalized optimal values to match the shape of options
        tiled_optimal_normalized = np.tile(optimal_normalized, (len(self.options), 1))

        # The answers normalized to the range [0, 1]
        normalized_answers = (answers - self.mins) / (self.maxs - self.mins + tiny)

        # The distance between each option and the optimal
        delta_vectors_normalized = (normalized_answers - tiled_optimal_normalized)
        # delta_magnitudes = np.linalg.norm(delta_vectors_normalized, axis=1)

        # The weighted delta vector between each option and the optimal
        weighted_delta_vectors_normalized = delta_vectors_normalized * tiled_weights

        # The magnitudes of the weighted delta vectors between each option and the optimal
        weighted_delta_magnitudes = np.linalg.norm(weighted_delta_vectors_normalized, axis=1)

        # A percentage of how much each factor contributed to the total distance between the optimal and each option
        # This is really num_options seperate vectors, but they're together for convenience
        # The sign indicates whether it was towrds or away from the optimal. Take the absolute value for the plain contribution
        per_option_contributions = weighted_delta_vectors_normalized / weighted_delta_magnitudes[:, None]

        # A percentage of how much each factor contributed to the distance from the optimal, divided by each option's distance
        # I'm not sure how useful this is: probably just use per_option_contributions or weighted_delta_vectors instead
        objective_contributions = per_option_contributions / np.tile(weighted_delta_magnitudes[:, None], (1, len(self.options)))

        # The average percentage of how much each factor deviates from the optimal
        # I'm about 85% sure this is correct
        mean_factor_relevances = np.mean(per_option_contributions, axis=0)
        # The normalized weighted distances between each option and the optimal
        normalized_weighted_dists = weighted_delta_magnitudes / worst_possible_distance
        inverted_normalized_weighted_dists = 1 - normalized_weighted_dists


        def best_worst_options(self, method:Literal['extremes', 'threshold'] = 'extremes', min_thresh=None, max_thresh=None):
            """ Get the best and worst options, along with explanations of why they're the best and worst

                if method == 'extremes', just give min and max 'because' and 'despite' values.
                if method == 'threshold', give the factors that are within min_thresh and max_thresh, or the best/worst factor if none are within the threshold.
                    if the thresholds are None, automatically calculate good thresholds based on the statistical distrobution of the normalized contributions.
            """
            best_idx = np.argmin(self.weighted_delta_magnitudes)
            worst_idx = np.argmax(self.weighted_delta_magnitudes)
            # Just in case there's multiple best or worst options
            options = np.array(self.options)

            if min_thresh is None:
                min_thresh = np.percentile(self.per_option_contributions(), 20)
            if max_thresh is None:
                max_thresh = np.percentile(self.per_option_contributions(), 80)
            print(min_thresh, max_thresh)

            best_because = self.factors['names'][self.per_option_contributions()[best_idx].argmin()]
            best_despite = self.factors['names'][self.per_option_contributions()[best_idx].argmax()]
            worst_because = self.factors['names'][self.per_option_contributions()[worst_idx].argmin()]
            worst_despite = self.factors['names'][self.per_option_contributions()[worst_idx].argmax()]
            best_because_thresh = list(np.array(self.factors['names'])[self.per_option_contributions()[best_idx] < min_thresh])
            best_despite_thresh = list(np.array(self.factors['names'])[self.per_option_contributions()[best_idx] > max_thresh])
            worst_because_thresh = list(np.array(self.factors['names'])[self.per_option_contributions()[worst_idx] > max_thresh])
            worst_despite_thresh = list(np.array(self.factors['names'])[self.per_option_contributions()[worst_idx] < min_thresh])

            if method == 'extremes':
                return {
                    'best': {
                        'is': options[best_idx],
                        'because': best_because,
                        'despite': best_despite,
                    },
                    'worst': {
                        'is': options[worst_idx],
                        'because': worst_because,
                        'despite': worst_despite,
                    }
                }
            elif method == 'threshold':
                # Ensure there's at least one that gets returned
                return {
                    'best': {
                        'is': options[best_idx],
                        'because': best_because_thresh if len(best_because_thresh) > 0 else [best_because],
                        'despite': best_despite_thresh if len(best_despite_thresh) > 0 else [best_despite],
                    },
                    'worst': {
                        'is': options[worst_idx],
                        'because': worst_because_thresh if len(worst_because_thresh) > 0 else [worst_because],
                        'despite': worst_despite_thresh if len(worst_despite_thresh) > 0 else [worst_despite],
                    }
                }

    def serialize(self):
        return {
            'name': self.name,
            'factors': self._factors,
            'options': self.options,
            'answers': self.answers.tolist(),
            'threshold': self.threshold,
        }

    @staticmethod
    def deserialize(data):
        d = Decision(data['name'])
        d._factors = data['factors']
        d.options = data['options']
        d.answers = np.array(data['answers'])
        d.threshold = data['threshold']
        return d

    @require_valid
    def monte_carlo(self, num_samples=1000) -> np.ndarray:
        """ Run a monte carlo simulation to get the distribution of possible scores """
        return np.array([self.calculate(np.random.normal(self.weighted_answers(.5), self.std_answers))['badness'] for _ in range(num_samples)])

    @require_valid
    def monte_carlo_summary(self, num_samples=1000) -> pd.DataFrame:
        """ Run a monte carlo simulation to get the distribution of possible scores """
        data = self.monte_carlo(num_samples)
        quantiles = np.quantile(data, [0, .25, .5, .75, 1], axis=0)
        return pd.DataFrame({
            'Option': self.options,
            'Mean': data.mean(axis=0),
            'Std': data.std(axis=0),
            'Min': quantiles[0],
            '25th': quantiles[1],
            '50th': quantiles[2],
            '75th': quantiles[3],
            'Max': quantiles[4],
        })
