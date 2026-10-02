from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
P = Path(__file__).resolve().parents[1] / "assets" / "images"
P.mkdir(parents=True, exist_ok=True)
N = 1024
CYAN = (54, 226, 255, 255)
VIOLET = (154, 107, 255, 255)
PATH = [(690,245),(366,245),(278,333),(278,691),(366,779),(690,779),(756,713),(756,554),(595,554),(595,655),(398,655),(380,637),(380,387),(398,369),(645,369),(645,437),(756,437)]

def mark(size, color=CYAN):
    # Scale the original vector up so the symbol fills the launcher safe area.
    scale = (size / N) * 1.4
    offset = (size - N * scale) / 2
    points = [(round(x * scale + offset), round(y * scale + offset)) for x, y in PATH]
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    stroke = max(4, round(80 * size / N))
    gd.line(points, fill=(*color[:3], 140), width=stroke, joint="curve")
    gd.line([(round(512*scale+offset),round(405*scale+offset)),(round(512*scale+offset),round(620*scale+offset))], fill=(*VIOLET[:3], 150), width=max(4,round(70*size/N)))
    layer = Image.alpha_composite(layer, glow.filter(ImageFilter.GaussianBlur(max(2, round(22 * size / N)))))
    draw = ImageDraw.Draw(layer)
    draw.line(points, fill=color, width=max(3,round(52*size/N)), joint="curve")
    draw.line([(round(512*scale+offset),round(402*scale+offset)),(round(512*scale+offset),round(624*scale+offset))], fill=VIOLET, width=max(4,round(54*size/N)))
    cx, cy, radius = round(777*scale+offset), round(437*scale+offset), max(3,round(10*size/N))
    draw.line([(round(756*scale+offset),cy),(cx,cy)], fill=color, width=max(3,round(28*size/N)))
    draw.ellipse((cx-radius,cy-radius,cx+radius,cy+radius), fill=(7,11,20,255), outline=color, width=max(2,round(5*size/N)))
    return layer

def background(size, grid=False):
    im = Image.new("RGBA", (size, size), (8,11,20,255))
    pix = im.load()
    for y in range(size):
        for x in range(size):
            dx, dy = (x-size*.5)/(size*.72), (y-size*.5)/(size*.72)
            strength = max(0, 1-(dx*dx+dy*dy))
            pix[x,y] = (8+int(3*strength),11+int(6*strength),20+int(12*strength),255)
    if grid:
        d=ImageDraw.Draw(im); step=max(24,size//16)
        for x in range(0,size,step): d.line((x,0,x,size),fill=(54,226,255,10),width=1)
        for y in range(0,size,step): d.line((0,y,size,y),fill=(54,226,255,10),width=1)
    return im

Image.alpha_composite(background(N, True), mark(N)).convert("RGB").save(P/"icon.png",quality=95)
mark(N).save(P/"android-icon-foreground.png")
mark(N,(255,255,255,255)).save(P/"android-icon-monochrome.png")
background(N,True).convert("RGB").save(P/"android-icon-background.png",quality=95)
mark(512).save(P/"splash-icon.png")
Image.alpha_composite(background(128),mark(128)).resize((64,64),Image.Resampling.LANCZOS).convert("RGB").save(P/"favicon.png",quality=95)
