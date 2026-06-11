import os
import firebase_admin
from firebase_admin import credentials, auth

_cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if not firebase_admin._apps:
    cred = credentials.Certificate(_cred_path)
    firebase_admin.initialize_app(cred)


def verify_google_token(id_token: str) -> dict:
    decoded = auth.verify_id_token(id_token)
    return decoded
