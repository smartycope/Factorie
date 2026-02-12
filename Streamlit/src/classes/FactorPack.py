from pathlib import Path
# import pandas as pd
import json
from PIL import Image, ImageDraw, ImageFont
from colorsys import hls_to_rgb
import numpy as np

FONT_PATH = 'VarelaRound-Regular.ttf'

class FactorPack:
    """ A collection of factors that can be applied to a decision """
    def __init__(self, name: str, path, desc: str, price: float, hue:float):
        self.name = name
        self.desc = desc
        self.factors = json.load(path.open('r'))['Factors']
        self.price = price

        # Just create an image with the name on a colored background for now
        w = 300
        self.image = Image.new('RGB', (w, w), color = tuple((np.array(hls_to_rgb(hue, .5, .5))*255).astype(int)))
        d = ImageDraw.Draw(self.image)
        fontsize = 20
        font = ImageFont.truetype(FONT_PATH, fontsize)
        d.text((5, w/2-fontsize/2), self.name, fill=(0,0,0), font=font)

    @property
    def amount(self):
        return len(self.factors)

    def __eq__(self, other):
        try:
            return self.name == other.name
        except AttributeError:
            return False

    def __hash__(self):
        return hash(self.name)


factor_pack_folder = Path('factor_packs')
FACTOR_PACKS = [
    FactorPack("Relationships", factor_pack_folder / 'relationships.json', 'Factors related to relationships, dating, and marriage', 7, 0),
    FactorPack("College", factor_pack_folder / 'college.json', 'Factors related to choosing which college to go to', 5, .1),
]