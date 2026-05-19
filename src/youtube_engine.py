import os
import sys
import json
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Alcance maestro de YouTube
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
TOKEN_URI = 'https://oauth2.googleapis.com/token'

def get_authenticated_service():
    token_json_str = os.environ.get('YOUTUBE_TOKEN_JSON')
    cred_json_str  = os.environ.get('YOUTUBE_CREDENTIALS_JSON')

    if not token_json_str:
        print('❌ FATAL: La variable de entorno YOUTUBE_TOKEN_JSON no está definida.')
        return None

    def clean_secret(val):
        val = val.strip()
        for marker in ['```json', '```']:
            if val.startswith(marker):
                val = val[len(marker):]
        if val.endswith('```'):
            val = val[:-3]
        return val.strip()

    # 1. Parsear el JSON del token
    try:
        token_str = clean_secret(token_json_str)
        try:
            token_data = json.loads(token_str)
        except json.JSONDecodeError:
            import base64
            token_data = json.loads(base64.b64decode(token_str).decode('utf-8'))
        print(f'✅ Token JSON parseado correctamente. Claves presentes: {list(token_data.keys())}')
    except Exception as e:
        print(f'❌ FATAL: No se pudo parsear YOUTUBE_TOKEN_JSON: {e}')
        return None

    # 2. Inyectar client_id/client_secret desde YOUTUBE_CREDENTIALS_JSON si se provee
    if cred_json_str:
        try:
            cred_str = clean_secret(cred_json_str)
            client_secrets = json.loads(cred_str)
            installed = client_secrets.get('installed', client_secrets.get('web', {}))
            token_data['client_id']     = installed.get('client_id',     token_data.get('client_id'))
            token_data['client_secret'] = installed.get('client_secret', token_data.get('client_secret'))
            print('✅ client_id y client_secret inyectados desde YOUTUBE_CREDENTIALS_JSON.')
        except Exception as e:
            print(f'⚠️ No se pudo parsear YOUTUBE_CREDENTIALS_JSON (se usará el que viene en el token): {e}')

    # 3. Garantizar que token_uri siempre esté presente
    token_data.setdefault('token_uri', TOKEN_URI)

    # 4. Verificar campos críticos
    for field in ['client_id', 'client_secret', 'refresh_token', 'token_uri']:
        if not token_data.get(field):
            print(f'❌ FATAL: El campo requerido "{field}" falta en el token JSON.')
            return None

    # 5. Construir credenciales y refrescar
    try:
        credentials = Credentials.from_authorized_user_info(token_data, SCOPES)
        print(f'✅ Credenciales creadas. valid={credentials.valid}, expired={credentials.expired}')
    except Exception as e:
        print(f'❌ FATAL: from_authorized_user_info falló: {e}')
        return None

    if not credentials.valid:
        if credentials.refresh_token:
            try:
                print('🔄 Refrescando token de acceso...')
                credentials.refresh(Request())
                print('✅ Token refrescado exitosamente.')
            except Exception as e:
                print(f'❌ FATAL: Falló el refresco del token: {e}')
                return None
        else:
            print('❌ FATAL: El token está inválido y no hay refresh_token disponible.')
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
