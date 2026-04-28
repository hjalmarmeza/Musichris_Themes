import os
import sys
from PIL import Image, ImageDraw, ImageFont

def generate_phase_card(title, body, output_path, width=1080, height=1920):
    # Canvas transparente
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    assets_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
    font_path = os.path.join(assets_dir, "Georgia-Bold.ttf")
    
    if not os.path.exists(font_path):
        font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"

    if title == "CIERRE":
        # Layout especial para el cierre ministerial (WOW Premium)
        try:
            font_social = ImageFont.truetype(font_path, 80)
            font_button = ImageFont.truetype(font_path, 45)
        except:
            font_social = font_button = ImageFont.load_default()

        # Dibujar @Musichris_Studio
        social_text = "@Musichris_Studio"
        w_s = draw.textbbox((0, 0), social_text, font=font_social)[2]
        draw.text(((width - w_s) // 2, 1350), social_text, font=font_social, fill="white")

        # Dibujar Botón Pill (Caminemos juntos en fe)
        btn_text = "¡Caminemos juntos en fe!"
        w_b = draw.textbbox((0, 0), btn_text, font=font_button)[2]
        h_b = draw.textbbox((0, 0), btn_text, font=font_button)[3]
        
        btn_w, btn_h = w_b + 120, h_b + 60
        btn_x = (width - btn_w) // 2
        btn_y = 1500
        
        # Sombra/Fondo del botón (Pill shape)
        draw.rounded_rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], radius=50, fill=(0, 0, 0, 160))
        draw.text(((width - w_b) // 2, btn_y + 25), btn_text, font=font_button, fill="white")
        
        img.save(output_path)
        return

    # Definir el área del repositorio (Sacrosanta) para fases normales
    repo_width = 750
    repo_height = 950
    repo_x_start = (width - repo_width) // 2
    repo_y_start = (height - repo_height) // 2

    # Lógica de escalado dinámico
    base_font_size = 75
    title_font_size = 55
    line_spacing = 20

    while base_font_size > 20:
        try:
            font_b = ImageFont.truetype(font_path, base_font_size)
            font_t = ImageFont.truetype(font_path, title_font_size)
        except:
            font_b = font_t = ImageFont.load_default()

        # Envoltura de texto
        words = body.split(' ')
        lines = []
        current_line = []
        for word in words:
            test_line = ' '.join(current_line + [word])
            w = draw.textbbox((0, 0), test_line, font=font_b)[2]
            if w <= repo_width - 80: # Margen interno
                current_line.append(word)
            else:
                lines.append(' '.join(current_line))
                current_line = [word]
        lines.append(' '.join(current_line))

        # Calcular altura total
        total_text_h = sum([draw.textbbox((0, 0), l, font=font_b)[3] for l in lines]) + (len(lines) * line_spacing) + 100
        
        if total_text_h <= repo_height - 100:
            break
        
        base_font_size -= 5
        title_font_size = max(30, title_font_size - 2)

    # Renderizado final centrado en el repositorio
    y_cursor = repo_y_start + (repo_height - total_text_h) // 2
    
    # --- DIAMOND GLASS CONTAINER ---
    # Dibujar un recuadro de cristal semitransparente para dar profundidad
    padding = 60
    box_rect = [repo_x_start - padding, repo_y_start - padding, repo_x_start + repo_width + padding, repo_y_start + repo_height + padding]
    
    # 1. Sombra exterior
    draw.rounded_rectangle(box_rect, radius=40, fill=(0, 0, 0, 180))
    # 2. Borde (Eliminado por petición para mayor limpieza visual)
    # draw.rounded_rectangle(box_rect, radius=40, outline="#00f2ff", width=3)
    
    # Dibujar Título (Solo si no está vacío)
    if title and title.strip():
        w_t = draw.textbbox((0, 0), title, font=font_t)[2]
        draw.text(((width - w_t) // 2, y_cursor), title, font=font_t, fill="#00f2ff")
        y_cursor += 80

    # Dibujar Cuerpo
    for line in lines:
        w_l = draw.textbbox((0, 0), line, font=font_b)[2]
        h_l = draw.textbbox((0, 0), line, font=font_b)[3]
        draw.text(((width - w_l) // 2, y_cursor), line, font=font_b, fill="white")
        y_cursor += h_l + line_spacing

    img.save(output_path)
    print(f"✅ Card fit success: {output_path} (Font: {base_font_size})")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit(1)
    generate_phase_card(sys.argv[1], sys.argv[2], sys.argv[3])
