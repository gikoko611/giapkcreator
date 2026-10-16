from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "branding" / "gi-logo-source.jpg"
OUTPUT = ROOT / "assets" / "images"
SIZE = 1024
SAFE_SCALE = 0.84


def square_crop(image: Image.Image) -> Image.Image:
    """Crop the portrait canvas to its centered square without cutting off the logo."""
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def corner_background(image: Image.Image) -> tuple[int, int, int]:
    """Sample the empty dark corners so the fitted image blends into its padding."""
    side = image.width
    sample = max(1, side // 24)
    points = []
    for x0, y0 in ((0, 0), (side - sample, 0), (0, side - sample), (side - sample, side - sample)):
        patch = image.crop((x0, y0, x0 + sample, y0 + sample))
        points.extend(list(patch.getdata()))
    count = len(points)
    return tuple(sum(pixel[channel] for pixel in points) // count for channel in range(3))


def fitted_canvas(image: Image.Image, size: int, scale: float = SAFE_SCALE) -> Image.Image:
    side = round(size * scale)
    fitted = image.resize((side, side), Image.Resampling.LANCZOS)
    background = corner_background(image)
    canvas = Image.new("RGB", (size, size), background)
    offset = (size - side) // 2
    canvas.paste(fitted, (offset, offset))
    return canvas


def save_png(image: Image.Image, path: Path) -> None:
    image.save(path, format="PNG", optimize=True, compress_level=9)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Brand source image not found: {SOURCE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)

    source = Image.open(SOURCE).convert("RGB")
    square = square_crop(source)
    icon = fitted_canvas(square, SIZE)

    # Standard square launcher icon and adaptive foreground use the same uncropped artwork.
    save_png(icon, OUTPUT / "icon.png")
    save_png(icon.convert("RGBA"), OUTPUT / "android-icon-foreground.png")

    # Keep the adaptive background consistent with the supplied artwork's dark corners.
    bg_color = corner_background(square)
    background = Image.new("RGB", (SIZE, SIZE), bg_color)
    save_png(background, OUTPUT / "android-icon-background.png")

    # Android themed icons use an alpha silhouette derived from the logo's own bright detail.
    gray = square.convert("L")
    mask = gray.point(lambda value: 0 if value < 24 else min(255, (value - 24) * 5))
    side = round(SIZE * SAFE_SCALE)
    mask = mask.resize((side, side), Image.Resampling.LANCZOS)
    monochrome = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 0))
    offset = (SIZE - side) // 2
    monochrome.putalpha(Image.new("L", (SIZE, SIZE), 0))
    full_mask = Image.new("L", (SIZE, SIZE), 0)
    full_mask.paste(mask, (offset, offset))
    monochrome.putalpha(full_mask)
    save_png(monochrome, OUTPUT / "android-icon-monochrome.png")

    # Splash stays centered and contained; favicon is a smaller square crop of the same logo.
    save_png(fitted_canvas(square, 512, 0.86).convert("RGBA"), OUTPUT / "splash-icon.png")
    favicon = fitted_canvas(square, 128, 0.84).resize((64, 64), Image.Resampling.LANCZOS)
    save_png(favicon, OUTPUT / "favicon.png")

    for name in (
        "icon.png",
        "android-icon-foreground.png",
        "android-icon-background.png",
        "android-icon-monochrome.png",
        "splash-icon.png",
        "favicon.png",
    ):
        with Image.open(OUTPUT / name) as generated:
            print(f"{name}: {generated.size[0]}x{generated.size[1]} {generated.mode}")


if __name__ == "__main__":
    main()
