"""Local-demo security settings. Importing this module never loads or prints secrets."""
import os
from urllib.parse import urlsplit

DEFAULT_ORIGINS = ('http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:8001')


def trusted_origins():
    values = tuple(part.strip().rstrip('/') for part in
                   os.getenv('FORGEMIND_CORS_ORIGINS', ','.join(DEFAULT_ORIGINS)).split(',') if part.strip())
    for value in values:
        url = urlsplit(value)
        if (url.scheme not in ('http', 'https') or not url.hostname or url.username or url.password
                or url.path or url.query or url.fragment or '*' in value):
            raise ValueError('FORGEMIND_CORS_ORIGINS must list exact HTTP(S) origins without paths or credentials')
    return values


def secure_cookie():
    return os.getenv('FORGEMIND_COOKIE_SECURE', 'false').strip().lower() == 'true'
