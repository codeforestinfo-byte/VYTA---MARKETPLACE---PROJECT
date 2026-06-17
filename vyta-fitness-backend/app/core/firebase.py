import os
import firebase_admin
from firebase_admin import credentials, auth

_cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

_firebase_available = False
if os.path.exists(_cred_path):
    try:
        if not firebase_admin._apps:
            cred = credentials.Certificate(_cred_path)
            firebase_admin.initialize_app(cred)
        _firebase_available = True
    except Exception as e:
        print(f"[firebase] init error: {e}")
        _firebase_available = False
else:
    print(f"[firebase] credentials file not found at {_cred_path}")


def verify_google_token(id_token: str) -> dict:
    if not _firebase_available:
        raise RuntimeError("Firebase is not configured")
    decoded = auth.verify_id_token(id_token)
    return decoded


def create_firebase_user(email: str, password: str) -> str | None:
    if not _firebase_available:
        return None
    try:
        user_record = auth.create_user(email=email, password=password)
        return user_record.uid
    except auth.EmailAlreadyExistsError:
        raise RuntimeError("Email already registered in Firebase")
    except Exception as e:
        print(f"[firebase] create_user error: {e}")
        return None


def generate_email_verification_link(email: str) -> str | None:
    if not _firebase_available:
        return None
    try:
        return auth.generate_email_verification_link(email)
    except Exception as e:
        print(f"[firebase] verification link error: {e}")
        return None


def generate_password_reset_link(email: str) -> str | None:
    if not _firebase_available:
        return None
    try:
        return auth.generate_password_reset_link(email)
    except Exception as e:
        print(f"[firebase] reset link error: {e}")
        return None


def delete_firebase_user(uid: str) -> bool:
    if not _firebase_available:
        return False
    try:
        auth.delete_user(uid)
        return True
    except Exception as e:
        print(f"[firebase] delete_user error: {e}")
        return False
