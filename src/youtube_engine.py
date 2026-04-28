import os
import sys
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Alcances para la API de YouTube
SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

def get_authenticated_service():
    credentials = None
    # Localización de tokens en Musichris_Theme/src
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    token_path = os.path.join(base_dir, 'src', 'token.pickle')
    secrets_path = os.path.join(base_dir, 'src', 'client_secrets.json')

    # 1. Intentar cargar desde pickle local
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            credentials = pickle.load(token)
    
    # 2. Refrescar si es necesario o iniciar flujo
    if not credentials or not credentials.valid:
        if credentials and credentials.expired and credentials.refresh_token:
            try:
                credentials.refresh(Request())
            except:
                credentials = None
        
        if not credentials:
            if os.path.exists(secrets_path):
                flow = InstalledAppFlow.from_client_secrets_file(secrets_path, SCOPES)
                credentials = flow.run_local_server(port=0)
                with open(token_path, 'wb') as token:
                    pickle.dump(credentials, token)
            else:
                return None

    return build('youtube', 'v3', credentials=credentials)

def upload_theme_video(video_path, title, description):
    print(f"🚀 Iniciando subida a YouTube: {title}")
    youtube = get_authenticated_service()
    if not youtube:
        print("❌ Error de autenticación. Asegúrate de tener client_secrets.json en src/")
        return None

    body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': ['MusiChris', 'Sabiduría', 'Reflexión', 'Fe'],
            'categoryId': '22' # People & Blogs
        },
        'status': {
            'privacyStatus': 'public',
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
        print("Uso: python3 youtube_engine.py <video_path> <titulo> <descripcion>")
        sys.exit(1)
    
    video_path = sys.argv[1]
    title = sys.argv[2]
    description = sys.argv[3]
    
    video_id = upload_theme_video(video_path, title, description)
    if video_id:
        print(f"✅ ÉXITO: Video subido con ID: {video_id}")
        print(f"🔗 URL: https://youtu.be/{video_id}")
    else:
        sys.exit(1)
