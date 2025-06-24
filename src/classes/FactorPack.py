from pathlib import Path
# import pandas as pd
import json


class FactorPack:
    """ A collection of factors that can be applied to a decision """
    def __init__(self, name: str, path, desc: str, price: float):
        self.name = name
        self.desc = desc
        self.factors = json.load(path.open('r'))
        self.price = price

    @property
    def amount(self):
        return len(self.factors)


factor_pack_folder = Path('factor_packs')
FACTOR_PACKS = [
    FactorPack("Relationships", factor_pack_folder / 'relationships.json', 'Factors related to relationships, dating, and marriage', 7),
    FactorPack("College", factor_pack_folder / 'college.json', 'Factors related to choosing which college to go to', 5),
]