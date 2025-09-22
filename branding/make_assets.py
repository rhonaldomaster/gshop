#!/usr/bin/env python3
"""
GSHOP Brand Asset Generator
Creates complete branding package for GSHOP TikTok Shop clone
"""

import os
from PIL import Image, ImageDraw, ImageFont
import cairosvg
import io

# Brand Colors
COLORS = {
    'primary': '#FF0050',      # Bright pink/red
    'secondary': '#000000',    # Black
    'accent': '#00C853',       # Green
    'background': '#FFFFFF',   # White
    'text': '#212121'          # Dark gray
}

def create_svg_logo(text="GSHOP", width=400, height=120, style="main"):
    """Create SVG logo with different styles"""
    
    if style == "horizontal":
        # Logo mark + text side by side
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .logo-text {{ font-family: 'Inter', sans-serif; font-weight: 700; font-size: 48px; }}
      .logo-mark {{ font-family: 'Inter', sans-serif; font-weight: 900; font-size: 36px; }}
    </style>
  </defs>
  
  <!-- Background circle for G -->
  <circle cx="40" cy="60" r="35" fill="{COLORS['primary']}" />
  
  <!-- G letter in white -->
  <text x="40" y="75" text-anchor="middle" fill="{COLORS['background']}" class="logo-mark">G</text>
  
  <!-- SHOP text -->
  <text x="90" y="75" fill="{COLORS['secondary']}" class="logo-text">SHOP</text>
  
  <!-- Accent dot -->
  <circle cx="350" cy="45" r="4" fill="{COLORS['accent']}" />
</svg>'''
    
    elif style == "vertical":
        # Logo mark stacked above text
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .logo-text {{ font-family: 'Inter', sans-serif; font-weight: 700; font-size: 32px; }}
      .logo-mark {{ font-family: 'Inter', sans-serif; font-weight: 900; font-size: 28px; }}
    </style>
  </defs>
  
  <!-- Background circle for G -->
  <circle cx="200" cy="40" r="30" fill="{COLORS['primary']}" />
  
  <!-- G letter in white -->
  <text x="200" y="52" text-anchor="middle" fill="{COLORS['background']}" class="logo-mark">G</text>
  
  <!-- SHOP text -->
  <text x="200" y="100" text-anchor="middle" fill="{COLORS['secondary']}" class="logo-text">SHOP</text>
  
  <!-- Accent dot -->
  <circle cx="280" cy="25" r="3" fill="{COLORS['accent']}" />
</svg>'''
    
    elif style == "icon":
        # Icon only version
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .logo-mark {{ font-family: 'Inter', sans-serif; font-weight: 900; font-size: 64px; }}
    </style>
  </defs>
  
  <!-- Background circle for G -->
  <circle cx="60" cy="60" r="50" fill="{COLORS['primary']}" />
  
  <!-- G letter in white -->
  <text x="60" y="85" text-anchor="middle" fill="{COLORS['background']}" class="logo-mark">G</text>
  
  <!-- Small accent elements -->
  <circle cx="95" cy="25" r="3" fill="{COLORS['accent']}" />
  <circle cx="25" cy="95" r="2" fill="{COLORS['accent']}" />
</svg>'''
    
    else:  # main style
        svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .logo-text {{ font-family: 'Inter', sans-serif; font-weight: 700; font-size: 52px; }}
      .logo-mark {{ font-family: 'Inter', sans-serif; font-weight: 900; font-size: 40px; }}
    </style>
  </defs>
  
  <!-- Background circle for G -->
  <circle cx="45" cy="60" r="38" fill="{COLORS['primary']}" />
  
  <!-- G letter in white -->
  <text x="45" y="78" text-anchor="middle" fill="{COLORS['background']}" class="logo-mark">G</text>
  
  <!-- SHOP text -->
  <text x="100" y="78" fill="{COLORS['secondary']}" class="logo-text">SHOP</text>
  
  <!-- Accent elements -->
  <circle cx="360" cy="35" r="4" fill="{COLORS['accent']}" />
  <circle cx="370" cy="85" r="3" fill="{COLORS['accent']}" />
</svg>'''
    
    return svg_content

def svg_to_png(svg_content, output_path, width=None, height=None):
    """Convert SVG to PNG"""
    try:
        png_data = cairosvg.svg2png(bytestring=svg_content.encode('utf-8'), 
                                   output_width=width, output_height=height)
        with open(output_path, 'wb') as f:
            f.write(png_data)
        print(f"Created: {output_path}")
    except Exception as e:
        print(f"Error creating {output_path}: {e}")

def create_app_icon(size=1024):
    """Create square app icon"""
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = size // 8
    circle_size = size - 2 * margin
    draw.ellipse([margin, margin, margin + circle_size, margin + circle_size], 
                fill=COLORS['primary'])
    
    # Try to load Inter font, fallback to default
    try:
        font_size = size // 3
        font = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Black.ttf", font_size)
    except:
        font_size = size // 4
        font = ImageFont.load_default()
    
    # Draw G letter
    text = "G"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - font_size // 8
    
    draw.text((x, y), text, fill=COLORS['background'], font=font)
    
    # Small accent dots
    dot_size = size // 40
    draw.ellipse([size - margin//2 - dot_size, margin//2, 
                 size - margin//2, margin//2 + dot_size], fill=COLORS['accent'])
    
    return img

def create_favicon():
    """Create favicon.ico"""
    # Create 32x32 icon
    icon = create_app_icon(32)
    icon.save('favicon.ico', format='ICO', sizes=[(32, 32)])
    print("Created: favicon.ico")

def create_brand_palette_image():
    """Create brand color palette showcase"""
    width, height = 800, 600
    img = Image.new('RGB', (width, height), COLORS['background'])
    draw = ImageDraw.Draw(img)
    
    # Try to load fonts
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Bold.ttf", 36)
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Medium.ttf", 18)
        code_font = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Regular.ttf", 14)
    except:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
        code_font = ImageFont.load_default()
    
    # Title
    draw.text((50, 30), "GSHOP Brand Colors", fill=COLORS['text'], font=title_font)
    
    # Color swatches
    colors_info = [
        ("Primary", COLORS['primary'], "Brand Pink"),
        ("Secondary", COLORS['secondary'], "Black"),
        ("Accent", COLORS['accent'], "Success Green"),
        ("Background", COLORS['background'], "White"),
        ("Text", COLORS['text'], "Dark Gray")
    ]
    
    y_start = 100
    swatch_size = 80
    
    for i, (name, color, desc) in enumerate(colors_info):
        x = 50 + (i * 140)
        y = y_start
        
        # Color swatch
        if color == COLORS['background']:
            # Add border for white color
            draw.rectangle([x-1, y-1, x+swatch_size+1, y+swatch_size+1], 
                         fill=COLORS['text'])
        draw.rectangle([x, y, x+swatch_size, y+swatch_size], fill=color)
        
        # Labels
        draw.text((x, y+swatch_size+10), name, fill=COLORS['text'], font=label_font)
        draw.text((x, y+swatch_size+35), color, fill=COLORS['text'], font=code_font)
        draw.text((x, y+swatch_size+55), desc, fill=COLORS['text'], font=code_font)
    
    # Typography section
    draw.text((50, 300), "Typography", fill=COLORS['text'], font=title_font)
    
    try:
        inter_font = ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Bold.ttf", 24)
        roboto_font = ImageFont.truetype("/usr/share/fonts/truetype/roboto/Roboto-Regular.ttf", 20)
    except:
        inter_font = title_font
        roboto_font = label_font
    
    draw.text((50, 350), "Inter - Primary Font (Headings)", fill=COLORS['text'], font=inter_font)
    draw.text((50, 390), "Roboto - Secondary Font (Body Text)", fill=COLORS['text'], font=roboto_font)
    
    # Logo preview
    draw.text((50, 450), "GSHOP", fill=COLORS['secondary'], font=title_font)
    draw.ellipse([45, 445, 65, 465], fill=COLORS['primary'])
    draw.text((50, 455), "G", fill=COLORS['background'], font=ImageFont.truetype("/usr/share/fonts/truetype/inter/Inter-Black.ttf", 16) if os.path.exists("/usr/share/fonts/truetype/inter/Inter-Black.ttf") else title_font)
    
    img.save('brand_palette.png')
    print("Created: brand_palette.png")

def main():
    """Generate all brand assets"""
    print("🎨 Generating GSHOP Brand Assets...")
    
    # Create main logo variations
    logos = {
        'main_logo': (400, 120, 'main'),
        'horizontal_logo': (400, 120, 'horizontal'),
        'vertical_logo': (300, 150, 'vertical'),
        'icon_only': (120, 120, 'icon')
    }
    
    for name, (width, height, style) in logos.items():
        # Create SVG
        svg_content = create_svg_logo(width=width, height=height, style=style)
        svg_path = f"{name}.svg"
        with open(svg_path, 'w') as f:
            f.write(svg_content)
        print(f"Created: {svg_path}")
        
        # Create high-res PNG
        png_path = f"{name}.png"
        svg_to_png(svg_content, png_path, width=width*4, height=height*4)
    
    # Create monochrome versions
    for color, suffix in [('#000000', 'black'), ('#FFFFFF', 'white')]:
        svg_mono = create_svg_logo().replace(COLORS['primary'], color).replace(COLORS['secondary'], color)
        svg_to_png(svg_mono, f"mono_{suffix}.png", width=1600, height=480)
    
    # Create app icons in various sizes
    sizes = [1024, 512, 192, 180, 152, 144, 96, 72, 48]
    for size in sizes:
        icon = create_app_icon(size)
        icon.save(f"app_icon_{size}x{size}.png")
        print(f"Created: app_icon_{size}x{size}.png")
    
    # Create favicon
    create_favicon()
    
    # Create brand palette showcase
    create_brand_palette_image()
    
    print("\n✅ GSHOP Brand Package Complete!")
    print("📁 Generated files:")
    for file in os.listdir('.'):
        if file.endswith(('.svg', '.png', '.ico')):
            print(f"   • {file}")

if __name__ == "__main__":
    main()
