"""Bake the wordmark's hover letterforms.

The pink itself is a CSS `filter` in index.css - that's what gives the hover
its sweep around the colour wheel. What a filter can't do is morphology, so
Photoshop's Minimum lands here instead, as a plain shape variant that the CSS
then tints along with everything else.

Rerun after replacing images/logo.png. Needs numpy and Pillow.
"""
import os

import numpy as np
from PIL import Image

IMAGES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'images') + os.sep


def load(name):
    return np.asarray(Image.open(IMAGES + name).convert('RGBA'), dtype=np.float64)


def save(arr, name):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')
    im.save(IMAGES + name)
    print('wrote', name, im.size)


def erode_disk(arr, radius):
    """A min over a disk - Photoshop's Minimum with Preserve = Roundness."""
    pad = int(np.ceil(radius))
    padded = np.pad(arr, ((pad, pad), (pad, pad), (0, 0)), mode='edge')
    out = np.full_like(arr, 255.0)
    h, w = arr.shape[:2]
    for dy in range(-pad, pad + 1):
        span = int(np.floor(np.sqrt(max(radius ** 2 - dy ** 2, 0))))
        for dx in range(-span, span + 1):
            y, x = pad + dy, pad + dx
            np.minimum(out, padded[y:y + h, x:x + w], out=out)
    return out


def dilate_disk(arr, radius):
    return 255.0 - erode_disk(255.0 - arr, radius)


# Wordmark: Minimum (roundness). The wordmark ships as light art on
# transparency, so the disk runs over the inverse to thicken the letters the
# way Minimum does on dark-on-white art in Photoshop. Radius is scaled to this
# 650px asset - 18px belongs to the full-res source, and at this size it eats
# the strokes whole.
#
# Colour is deliberately left alone: index.css tints this copy with the same
# `filter` chain as everything else, so the hue still travels its long way
# round on hover. All this file contributes is the letterforms.
LOGO_RADIUS = 8
save(dilate_disk(load('logo.png'), LOGO_RADIUS), 'logo_hover.png')
