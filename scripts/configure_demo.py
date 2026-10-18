"""Prepare local demo credentials without printing or overwriting secrets."""
import secrets
from pathlib import Path

from dotenv import dotenv_values, set_key

ROOT = Path(__file__).resolve().parents[1]


def configure(root=ROOT):
    target = root / '.env'
    if not target.exists():
        target.write_text((root / '.env.example').read_text(encoding='utf-8'), encoding='utf-8')
    config = dotenv_values(target)
    for name in ('FORGEMIND_ADMIN_TOKEN', 'FORGEMIND_TECHNICIAN_TOKEN'):
        if not config.get(name):
            set_key(str(target), name, secrets.token_urlsafe(40))
    return bool(config.get('AMD_API_KEY'))


if __name__ == '__main__':
    configured = configure()
    print('Local .env prepared. Existing values were preserved. Demo tokens are stored only in .env.')
    print('AMD key already present.' if configured else 'Add your team AMD_API_KEY in .env before requesting AI analysis.')
    print('For administrator access, copy FORGEMIND_ADMIN_TOKEN from .env into Settings in the local app.')
