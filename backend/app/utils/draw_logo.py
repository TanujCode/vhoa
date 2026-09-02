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
    font_url = "https://raw.githubusercontent.com/adrianhajdin/uber/main/assets/fonts/PlusJakartaSans-ExtraBold.ttf"
    local_path = "d:\\Vhoa_Management\\PlusJakartaSans-ExtraBold.ttf"
    if not os.path.exists(local_path):
        try:
            print("Downloading Plus Jakarta Sans font...")
            urllib.request.urlretrieve(font_url, local_path)
            print("Font downloaded successfully.")
        except Exception as e:
            print(f"Failed to download font: {e}")
    return local_path if os.path.exists(local_path) else None

def draw_stretched_text(text, font, fill_color, target_w, height):
    # Create a small strip for the text to find its natural size
    temp_img = Image.new("RGBA", (4000, 1000), (0, 0, 0, 0))
    temp_draw = ImageDraw.Draw(temp_img)
    bbox = temp_draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    
    # Create strip of natural size
    strip = Image.new("RGBA", (w, height), (0, 0, 0, 0))
    strip_draw = ImageDraw.Draw(strip)
    # Draw text at baseline (736)
    strip_draw.text((0, 736), text, font=font, fill=fill_color, anchor="ls")
    
    # Resize to target stretched width
    stretched = strip.resize((target_w, height), Image.Resampling.LANCZOS)
    return stretched

def draw_logo_elements(is_dark_bg: bool, is_glow: bool, font):
    img = Image.new("RGBA", (3648, 896), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors setup
    if is_glow:
        text_color = (255, 255, 255, 255)
        color_start = (255, 255, 255, 255)
        color_end = (255, 255, 255, 255)
    else:
        if is_dark_bg:
            text_color = (255, 255, 255, 255)
            color_start = (116, 185, 255, 255) # #74B9FF
            color_end = (56, 130, 246, 255)   # #3882F6
        else:
            text_color = (15, 23, 42, 255)     # #0F172A (dark slate)
            color_start = (91, 164, 245, 255)  # #5BA4F5
            color_end = (29, 104, 223, 255)    # #1D68DF

    # Draw House shape
    g_w = 976 - 528
    g_h = 720 - 64
    if is_glow:
        draw.polygon([(528, 336), (752, 64), (976, 336)], fill=(255, 255, 255, 255))
        draw.rounded_rectangle([(528, 384), (976, 464)], radius=40, fill=(255, 255, 255, 255))
        draw.rounded_rectangle([(528, 512), (976, 592)], radius=40, fill=(255, 255, 255, 255))
        draw.rounded_rectangle([(528, 640), (976, 720)], radius=40, fill=(255, 255, 255, 255))
    else:
        gradient_box = Image.new("RGBA", (g_w, g_h))
        for x in range(g_w):
            for y in range(g_h):
                factor = (x / g_w + y / g_h) / 2.0
                r = int(color_start[0] * (1 - factor) + color_end[0] * factor)
                g = int(color_start[1] * (1 - factor) + color_end[1] * factor)
                b = int(color_start[2] * (1 - factor) + color_end[2] * factor)
                gradient_box.putpixel((x, y), (r, g, b, 255))
        house_mask = Image.new("L", (3648, 896), 0)
        mask_draw = ImageDraw.Draw(house_mask)
        mask_draw.polygon([(528, 336), (752, 64), (976, 336)], fill=255)
        mask_draw.rounded_rectangle([(528, 384), (976, 464)], radius=40, fill=255)
        mask_draw.rounded_rectangle([(528, 512), (976, 592)], radius=40, fill=255)
        mask_draw.rounded_rectangle([(528, 640), (976, 720)], radius=40, fill=255)
        
        house_gradient = Image.new("RGBA", (3648, 896), (0, 0, 0, 0))
        house_gradient.paste(gradient_box, (528, 64))
        img.paste(house_gradient, (0, 0), house_mask)

    # Window panes (Always white)
    if not is_glow:
        draw.rectangle([(704, 160), (752, 208)], fill=(255, 255, 255, 255))
        draw.rectangle([(776, 160), (824, 208)], fill=(255, 255, 255, 255))
        draw.rectangle([(704, 232), (752, 280)], fill=(255, 255, 255, 255))
        draw.rectangle([(776, 232), (824, 280)], fill=(255, 255, 255, 255))

    # Draw Stretched Text "N" (target x=48, target width=416)
    if font:
        n_stretched = draw_stretched_text("N", font, text_color, 416, 896)
        img.paste(n_stretched, (48, 0), n_stretched)
        
        # Draw Stretched Text "STBL" (target x=1040, target width=1440)
        stbl_stretched = draw_stretched_text("STBL", font, text_color, 1440, 896)
        img.paste(stbl_stretched, (1040, 0), stbl_stretched)
    else:
        draw.text((48, 200), "N", fill=text_color)
        draw.text((1040, 200), "STBL", fill=text_color)

    # Draw OQ circles and tail
    bezier_points = []
    for t in range(31):
        t_val = t / 30.0
        x = (1-t_val)**3 * 3056 + 3*(1-t_val)**2*t_val * 3088 + 3*(1-t_val)*t_val**2 * 3136 + t_val**3 * 3296
        y = (1-t_val)**3 * 656 + 3*(1-t_val)**2*t_val * 736 + 3*(1-t_val)*t_val**2 * 800 + t_val**3 * 800
        bezier_points.append((x, y))

    draw.ellipse([(2704 - 208, 528 - 208), (2704 + 208, 528 + 208)], outline=color_end, width=72)
    draw.ellipse([(2976 - 208, 528 - 208), (2976 + 208, 528 + 208)], outline=color_end, width=72)
    draw.line(bezier_points, fill=color_end, width=72, joint="round")

    return img

def generate_logo_variant(logo_name: str, is_dark_bg: bool):
    try:
        width_large = 3648
        height_large = 896
        
        font_path = download_font()
        font = ImageFont.truetype(font_path, 576) if font_path else None
        
        img = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        
        # Shadows configuration
        if is_dark_bg:
            shadow_fill = (0, 0, 0, 100)
            circle_shadow_fill = (0, 0, 0, 80)
            overlap_shadow_fill = (0, 0, 0, 100)
        else:
            shadow_fill = (15, 23, 42, 35)
            circle_shadow_fill = (15, 23, 42, 25)
            overlap_shadow_fill = (15, 23, 42, 45)

        # 1. House Shadow
        house_shadow = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(house_shadow)
        shadow_draw.polygon([(528, 336), (752, 64), (976, 336)], fill=shadow_fill)
        shadow_draw.rounded_rectangle([(528, 384), (976, 464)], radius=40, fill=shadow_fill)
        shadow_draw.rounded_rectangle([(528, 512), (976, 592)], radius=40, fill=shadow_fill)
        shadow_draw.rounded_rectangle([(528, 640), (976, 720)], radius=40, fill=shadow_fill)
        house_shadow = house_shadow.filter(ImageFilter.GaussianBlur(16))
        img.paste(house_shadow, (0, 20), house_shadow)

        # 2. OQ Shadow
        bezier_points = []
        for t in range(31):
            t_val = t / 30.0
            x = (1-t_val)**3 * 3056 + 3*(1-t_val)**2*t_val * 3088 + 3*(1-t_val)*t_val**2 * 3136 + t_val**3 * 3296
            y = (1-t_val)**3 * 656 + 3*(1-t_val)**2*t_val * 736 + 3*(1-t_val)*t_val**2 * 800 + t_val**3 * 800
            bezier_points.append((x, y))

        o_shadow = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        o_shadow_draw = ImageDraw.Draw(o_shadow)
        o_shadow_draw.ellipse([(2704 - 208, 528 - 208), (2704 + 208, 528 + 208)], outline=circle_shadow_fill, width=72)
        o_shadow = o_shadow.filter(ImageFilter.GaussianBlur(16))
        img.paste(o_shadow, (0, 16), o_shadow)

        q_shadow = Image.new("RGBA", (width_large, height_large), (0, 0, 0, 0))
        q_shadow_draw = ImageDraw.Draw(q_shadow)
        q_shadow_draw.ellipse([(2976 - 208, 528 - 208), (2976 + 208, 528 + 208)], outline=overlap_shadow_fill, width=72)
        q_shadow_draw.line(bezier_points, fill=overlap_shadow_fill, width=72, joint="round")
        q_shadow = q_shadow.filter(ImageFilter.GaussianBlur(16))
        img.paste(q_shadow, (-32, 24), q_shadow)

        # 3. White background glow halo (for logo_light.png, to look perfect on dark modes)
        if not is_dark_bg:
            glow_elements = draw_logo_elements(is_dark_bg, is_glow=True, font=font)
            # Blur the glow elements significantly to create a beautiful, smooth background halo outline
            glow_blurred = glow_elements.filter(ImageFilter.GaussianBlur(28))
            img.paste(glow_blurred, (0, 0), glow_blurred)

        # 4. Draw Logo Elements
        logo_elements = draw_logo_elements(is_dark_bg, is_glow=False, font=font)
        img.paste(logo_elements, (0, 0), logo_elements)

        # 5. Downsample to target size 912 x 224
        img_resized = img.resize((912, 224), Image.Resampling.LANCZOS)
        
        # Save to all required paths
        paths = [
            f"d:\\Vhoa_Management\\frontend\\hoa-portal\\src\\assets\\{logo_name}",
            f"d:\\Vhoa_Management\\frontend\\hoa-portal\\public\\{logo_name}",
            f"d:\\Vhoa_Management\\frontend\\hoa-portal\\dist\\{logo_name}"
        ]
        for path in paths:
            try:
                os.makedirs(os.path.dirname(path), exist_ok=True)
                img_resized.save(path, "PNG")
                print(f"Successfully generated logo image at: {path}")
            except Exception as e:
                pass
    except Exception as e:
        print(f"Error generating variant {logo_name}: {e}")

def generate_logos():
    # 1. logo_dark.png is the white text variant (used on dark backgrounds)
    generate_logo_variant("logo_dark.png", is_dark_bg=True)
    # 2. logo_light.png is the dark text variant with halo glow (used on light backgrounds & mobile friendly)
    generate_logo_variant("logo_light.png", is_dark_bg=False)

if __name__ == "__main__":
    generate_logos()
