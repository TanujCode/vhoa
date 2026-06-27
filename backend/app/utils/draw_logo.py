import os
import subprocess
import sys

# Ensure pillow is installed
try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
    except Exception as e:
        print(f"Failed to install pillow: {e}")
        pass

def download_font():
    import urllib.request
    font_url = "https://github.com/google/fonts/raw/main/ofl/plusjakartasans/static/PlusJakartaSans-ExtraBold.ttf"
    local_path = "d:\\Vhoa_Management\\PlusJakartaSans-ExtraBold.ttf"
    if not os.path.exists(local_path):
        try:
            print("Downloading Plus Jakarta Sans font...")
            urllib.request.urlretrieve(font_url, local_path)
            print("Font downloaded successfully.")
        except Exception as e:
            print(f"Failed to download font: {e}")
    return local_path if os.path.exists(local_path) else None

def generate_logo():
    try:
        # We will draw at 16x resolution (3648 x 896) and then downsample to 912 x 224
        # to achieve ultra-sharp anti-aliased vector borders and gradients.
        width_large = 3648
        height_large = 896
        
        img = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Colors from Logo.jsx for dark background
        color_start = (116, 185, 255, 255) # #74B9FF
        color_end = (56, 130, 246, 255)   # #3882F6 (circleColor and endColor)
        
        # 1. Download and load font
        font_path = download_font()
        if font_path:
            font = ImageFont.truetype(font_path, 576)
            print("Loaded Plus Jakarta Sans font successfully.")
        else:
            font = None
            print("Could not load Plus Jakarta Sans. Falling back.")

        # 2. Draw House Icon (E) Shadow
        house_shadow = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(house_shadow)
        shadow_draw.polygon([(528, 336), (752, 64), (976, 336)], fill=(0, 0, 0, 100))
        shadow_draw.rounded_rectangle([(528, 384), (976, 464)], radius=40, fill=(0, 0, 0, 100))
        shadow_draw.rounded_rectangle([(528, 512), (976, 592)], radius=40, fill=(0, 0, 0, 100))
        shadow_draw.rounded_rectangle([(528, 640), (976, 720)], radius=40, fill=(0, 0, 0, 100))
        house_shadow = house_shadow.filter(ImageFilter.GaussianBlur(16))
        # Paste shadow with a small Y offset
        img.paste(house_shadow, (0, 20), house_shadow)

        # 3. Draw House Icon Gradient
        # Create a bounding box image for the gradient
        g_w = 976 - 528
        g_h = 720 - 64
        gradient_box = Image.new("RGBA", (g_w, g_h))
        for x in range(g_w):
            for y in range(g_h):
                # Diagonal gradient
                factor = (x / g_w + y / g_h) / 2.0
                r = int(color_start[0] * (1 - factor) + color_end[0] * factor)
                g = int(color_start[1] * (1 - factor) + color_end[1] * factor)
                b = int(color_start[2] * (1 - factor) + color_end[2] * factor)
                gradient_box.putpixel((x, y), (r, g, b, 255))

        # House mask
        house_mask = Image.new("L", (width_large, height_large), 0)
        mask_draw = ImageDraw.Draw(house_mask)
        mask_draw.polygon([(528, 336), (752, 64), (976, 336)], fill=255)
        mask_draw.rounded_rectangle([(528, 384), (976, 464)], radius=40, fill=255)
        mask_draw.rounded_rectangle([(528, 512), (976, 592)], radius=40, fill=255)
        mask_draw.rounded_rectangle([(528, 640), (976, 720)], radius=40, fill=255)

        # Paste gradient using mask
        house_gradient = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        house_gradient.paste(gradient_box, (528, 64))
        img.paste(house_gradient, (0, 0), house_mask)

        # Draw Window Panes
        draw.rectangle([(704, 160), (752, 208)], fill=(255, 255, 255, 255))
        draw.rectangle([(776, 160), (824, 208)], fill=(255, 255, 255, 255))
        draw.rectangle([(704, 232), (752, 280)], fill=(255, 255, 255, 255))
        draw.rectangle([(776, 232), (824, 280)], fill=(255, 255, 255, 255))

        # 4. Draw Text "N" and "STBL" in white
        if font:
            draw.text((48, 736), "N", font=font, fill=(255, 255, 255, 255), anchor="ls")
            draw.text((1040, 736), "STBL", font=font, fill=(255, 255, 255, 255), anchor="ls")
        else:
            # Fallback text drawing
            draw.text((48, 200), "N", fill=(255, 255, 255, 255))
            draw.text((1040, 200), "STBL", fill=(255, 255, 255, 255))

        # 5. Draw Overlapping O and Q Circles and Q-Tail
        # O circle: cx=2704, cy=528, r=208, strokeWidth=72
        # Q circle: cx=2976, cy=528, r=208, strokeWidth=72
        # Q-tail Bezier points:
        bezier_points = []
        for t in range(31):
            t_val = t / 30.0
            x = (1-t_val)**3 * 3056 + 3*(1-t_val)**2*t_val * 3088 + 3*(1-t_val)*t_val**2 * 3136 + t_val**3 * 3296
            y = (1-t_val)**3 * 656 + 3*(1-t_val)**2*t_val * 736 + 3*(1-t_val)*t_val**2 * 800 + t_val**3 * 800
            bezier_points.append((x, y))

        # O Circle Shadow
        o_shadow = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        o_shadow_draw = ImageDraw.Draw(o_shadow)
        o_shadow_draw.ellipse([(2704 - 208, 528 - 208), (2704 + 208, 528 + 208)], outline=(0, 0, 0, 80), width=72)
        o_shadow = o_shadow.filter(ImageFilter.GaussianBlur(16))
        img.paste(o_shadow, (0, 16), o_shadow)

        # Draw O Circle
        draw.ellipse([(2704 - 208, 528 - 208), (2704 + 208, 528 + 208)], outline=color_end, width=72)

        # Q Circle and Tail Shadow
        q_shadow = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        q_shadow_draw = ImageDraw.Draw(q_shadow)
        q_shadow_draw.ellipse([(2976 - 208, 528 - 208), (2976 + 208, 528 + 208)], outline=(0, 0, 0, 100), width=72)
        q_shadow_draw.line(bezier_points, fill=(0, 0, 0, 100), width=72, joint="round")
        q_shadow = q_shadow.filter(ImageFilter.GaussianBlur(16))
        # Offset Q shadow slightly
        img.paste(q_shadow, (-32, 24), q_shadow)

        # Draw Q Circle and Tail
        draw.ellipse([(2976 - 208, 528 - 208), (2976 + 208, 528 + 208)], outline=color_end, width=72)
        draw.line(bezier_points, fill=color_end, width=72, joint="round")

        # 6. Downsample to target size 912 x 224 (4x downsampling)
        img_resized = img.resize((912, 224), Image.Resampling.LANCZOS)

        # Save to assets in both workspace and git clone paths
        paths = [
            r"d:\Vhoa_Management\frontend\hoa-portal\src\assets\logo_light.png",
            r"D:\github code cc\vhoa\frontend\hoa-portal\src\assets\logo_light.png"
        ]
        for path in paths:
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                img_resized.save(path, "PNG")
                print(f"Successfully generated logo image at: {path}")
            except Exception as e:
                print(f"Error saving to {path}: {e}")
                
    except Exception as e:
        print(f"Error drawing logo: {e}")

if __name__ == "__main__":
    generate_logo()
