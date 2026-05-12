import os
import sys
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Alcances para la API de YouTube
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

from google.oauth2.credentials import Credentials
import json

def get_authenticated_service():
    credentials = None
    
    # Intentar cargar desde la variable de entorno unificada YOUTUBE_TOKEN_JSON
    token_json_str = os.environ.get('YOUTUBE_TOKEN_JSON')
    if token_json_str:
        try:
            # Podría venir en JSON directo o en Base64, intentamos ambos
            try:
                token_data = json.loads(token_json_str)
            except:
                import base64
                token_data = json.loads(base64.b64decode(token_json_str).decode('utf-8'))
                
            # Agregamos client_id y client_secret al token_data si faltan
            cred_json_str = os.environ.get('YOUTUBE_CREDENTIALS_JSON')
            if cred_json_str:
                client_secrets = json.loads(cred_json_str)
                installed = client_secrets.get('installed', client_secrets.get('web', {}))
                token_data['client_id'] = installed.get('client_id')
                token_data['client_secret'] = installed.get('client_secret')
                
            credentials = Credentials.from_authorized_user_info(token_data, SCOPES)
        except Exception as e:
            print(f"⚠️ Error cargando token JSON: {e}")

    # Si no se pudo desde entorno, intentar flujo local (fallback)
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
            except:
                credentials = None

    if not credentials:
        print("❌ Error de autenticación profunda: No se pudo cargar o refrescar el token.")
        return None

    return build('youtube', 'v3', credentials=credentials)

def upload_theme_video(video_path, title, description, tags=None):
    print(f"🚀 Iniciando subida a YouTube: {title}")
    youtube = get_authenticated_service()
    if not youtube:
        print("❌ Error de autenticación. Asegúrate de tener client_secrets.json en src/")
        return None

    if not tags:
        tags = ['MusiChris', 'Sabiduría', 'Reflexión', 'Fe']

    body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': tags,
            'categoryId': '22' # People & Blogs
        },
        'status': {
            'privacyStatus': 'unlisted',
            'selfDeclaredMadeForKids': False
        }
    }

    media = MediaFileUpload(video_path, chunksize=1024*1024, resumable=True)
    request = youtube.videos().insert(part=','.join(body.keys()), body=body, media_body=media)
    
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"📊 Progreso: {int(status.progress() * 100)}%")
            
    return response.get('id')

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python3 youtube_engine.py <video_path> <titulo> <descripcion> <tags_comma_separated>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    # Limpieza de seguridad para YouTube
    title = sys.argv[2].strip().replace("\n", " ")
    if len(title) > 95:
        title = title[:92] + "..."
    
    description = sys.argv[3]
    tags = sys.argv[4].split(',') if len(sys.argv) > 4 else None
    
    video_id = upload_theme_video(video_path, title, description, tags)

    if video_id:
        print(f"✅ ÉXITO: Video subido con ID: {video_id}")
        print(f"🔗 URL: https://youtu.be/{video_id}")
    else:
        sys.exit(1)
