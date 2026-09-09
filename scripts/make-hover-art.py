"""Generate the pink hover variants of the site's artwork.

The hover states are pre-rendered rather than done with CSS `filter` because
filters interpolate their own parameters (which is what made the old blue hover
sweep through red on the way), can't land on an exact colour for both light and
dark source art, and have no morphology operator at all.
"""
import numpy as np
from PIL import Image

PINK = np.array([0xF2, 0x5F, 0xA3], dtype=np.float64)
IMAGES = '/home/caden-crowson/Documents/programming_scripts/Logan/websites/pollish-the-project/images/'


def load(name):
    return np.asarray(Image.open(IMAGES + name).convert('RGBA'), dtype=np.float64)


def save(arr, name, **kw):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), 'RGBA')
    if name.endswith('.jpg'):
        im.convert('RGB').save(IMAGES + name, quality=90, **kw)
    else:
        im.save(IMAGES + name, **kw)
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


def luminance(arr):
    return (arr[..., :3] * [0.2126, 0.7152, 0.0722]).sum(-1) / 255.0


def flat_pink(arr):
    """Ink-on-transparency -> the same shape in exactly #F25FA3.

    Colour lives in the alpha channel for this art, so replacing RGB wholesale
    keeps every antialiased edge while making the ink an exact match.
    """
    out = arr.copy()
    out[..., :3] = PINK
    return out


def textured_pink(arr):
    """Like flat_pink, but folds the art's own grain into alpha so the
    wordmark keeps its texture instead of going a dead flat swatch."""
    lum = luminance(arr)
    hi = np.percentile(lum[arr[..., 3] > 128], 92) if (arr[..., 3] > 128).any() else 1.0
    out = arr.copy()
    out[..., :3] = PINK
    out[..., 3] = arr[..., 3] * np.clip(lum / hi, 0, 1)
    return out


def duotone(arr):
    """Opaque photo -> dark pixels become #F25FA3, white stays white."""
    lum = luminance(arr)[..., None]
    out = arr.copy()
    out[..., :3] = PINK + (255.0 - PINK) * lum
    return out


# Line art: exact flat #F25FA3.
for name in ('pollish_closed.png', 'pollish_open.png', 'rareroom_logo.png'):
    save(flat_pink(load(name)), name.replace('.png', '_hover.png'))

# Wordmark: Minimum (roundness) first, then pink. The wordmark ships as light
# art on transparency, so Minimum's disk runs over the inverse to thicken the
# letters the way it does on dark-on-white art in Photoshop. Radius is scaled
# to this 650px asset - 18px belongs to the full-res source.
LOGO_RADIUS = 5
logo = load('logo.png')
save(textured_pink(255.0 - erode_disk(255.0 - logo, LOGO_RADIUS)), 'logo_hover.png')

# Album art: opaque, so duotone it. Downscale - it renders ~200px wide.
album = load('ayhp_album_art.jpg')
album_small = np.asarray(
    Image.fromarray(album.astype(np.uint8), 'RGBA').resize((1200, 1200), Image.LANCZOS),
    dtype=np.float64)
save(duotone(album_small), 'ayhp_album_art_hover.jpg')
