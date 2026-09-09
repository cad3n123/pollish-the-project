"""Bake the hover artwork that CSS can't produce on its own.

Two different jobs, because the wordmark and the carousel want opposite things
out of their hover:

  Wordmark - keeps a CSS `filter` for colour, so the hue still sweeps its long
  way round the wheel on the way in. A filter has no morphology operator
  though, so Photoshop's Minimum is baked here as a plain shape variant that
  the CSS then tints along with everything else.

  Carousel - crossfades to a finished pink copy instead, which lands on exactly
  #F25FA3 (a filter can't, from source art this far apart in luminance) and
  interpolates straight there with no colour sweep.

Rerun after replacing any of the source artwork. Needs numpy and Pillow.
"""
import os

import numpy as np
from PIL import Image

PINK = np.array([0xF2, 0x5F, 0xA3], dtype=np.float64)
IMAGES = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'images') + os.sep


def load(name):
    return np.asarray(Image.open(IMAGES + name).convert('RGBA'), dtype=np.float64)


def save(arr, name):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')
    if name.endswith('.jpg'):
        im.convert('RGB').save(IMAGES + name, quality=90)
    else:
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


def flat_pink(arr):
    """Ink-on-transparency -> the same shape in exactly #F25FA3.

    The shape lives in the alpha channel for this art, so replacing RGB
    wholesale keeps every antialiased edge while making the ink an exact match.
    """
    out = arr.copy()
    out[..., :3] = PINK
    return out


def duotone(arr):
    """Opaque photo -> dark pixels become #F25FA3, white stays white.

    A flat recolour would turn the album art into a solid pink block, since
    unlike the line art it has no transparency to carry the drawing.
    """
    lum = (arr[..., :3] * [0.2126, 0.7152, 0.0722]).sum(-1)[..., None] / 255.0
    out = arr.copy()
    out[..., :3] = PINK + (255.0 - PINK) * lum
    return out


# Wordmark: Minimum (roundness), letterforms only. It ships as light art on
# transparency, so the disk runs over the inverse to thicken the letters the
# way Minimum does on dark-on-white art in Photoshop. The radius is scaled to
# this 650px asset - 18px belongs to the full-res source, and at this size it
# eats the strokes whole.
LOGO_RADIUS = 9  # 18px in the full-res Photoshop source
save(dilate_disk(load('logo.png'), LOGO_RADIUS), 'logo_hover.png')

# Carousel line art: exact flat #F25FA3.
for name in ('pollish_closed.png', 'pollish_open.png', 'rareroom_logo.png'):
    save(flat_pink(load(name)), name.replace('.png', '_hover.png'))

# Album art: opaque, so duotone it. Downscaled - it renders ~200px wide.
album = Image.open(IMAGES + 'ayhp_album_art.jpg').convert('RGBA').resize((1200, 1200), Image.LANCZOS)
save(duotone(np.asarray(album, dtype=np.float64)), 'ayhp_album_art_hover.jpg')
