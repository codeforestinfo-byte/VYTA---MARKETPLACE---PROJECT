import requests

from app.core.config import settings


def firebase_login(email: str, password: str) -> str:
    """Exchange email + password for a Firebase ID token via the REST API.

    Returns the idToken string on success.
    Raises ValueError with a user-friendly message on failure.
    """
    api_key = settings.FIREBASE_API_KEY
    if not api_key:
        raise ValueError(
            "FIREBASE_API_KEY is not configured. "
            "Set it in the .env file or environment."
        )

    url = (
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
        f"?key={api_key}"
    )

    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }

    try:
        resp = requests.post(url, json=payload, timeout=15)
        data = resp.json()
    except requests.RequestException as e:
        raise ValueError(f"Unable to reach Firebase authentication service: {e}")

    if resp.status_code != 200:
        error_code = data.get("error", {}).get("message", "UNKNOWN")
        _raise_friendly_error(error_code)

    return data["idToken"]


def _raise_friendly_error(code: str) -> None:
    mapping = {
        "EMAIL_NOT_FOUND": "No account found with this email address.",
        "INVALID_PASSWORD": "Invalid email or password.",
        "INVALID_LOGIN_CREDENTIALS": "Invalid email or password.",
        "USER_DISABLED": "This account has been disabled.",
        "TOO_MANY_ATTEMPTS_TRY_LATER": (
            "Too many unsuccessful login attempts. Please try again later."
        ),
        "INVALID_EMAIL": "The email address is badly formatted.",
    }
    msg = mapping.get(code, f"Authentication failed (code: {code}).")
    raise ValueError(msg)
