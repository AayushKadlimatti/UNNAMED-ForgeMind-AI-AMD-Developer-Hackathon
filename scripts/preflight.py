"""Read-only local-demo checks; never print credentials or make AMD requests."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
from urllib.parse import urlparse
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]


def main():
    checks = []
    for package in ('fastapi', 'uvicorn', 'httpx', 'pydantic', 'dotenv', 'sqlalchemy'):
        checks.append((f'Python dependency: {package}', importlib.util.find_spec(package) is not None))
    node = shutil.which('node')
    compatible = False
    if node:
        version = subprocess.run([node, '--version'], capture_output=True, text=True, timeout=5).stdout.strip().lstrip('v').split('.')
        try:
            major, minor = int(version[0]), int(version[1])
            compatible = (major == 20 and minor >= 19) or major > 22 or (major == 22 and minor >= 12)
        except (ValueError, IndexError):
            pass
    checks.append(('Node.js version compatible with Vite (20.19+ in 20.x, or 22.12+)', compatible))
    checks.append(('Frontend dependencies installed', (ROOT / 'frontend/node_modules').is_dir()))
    if importlib.util.find_spec('dotenv'):
        from dotenv import dotenv_values
        config = dotenv_values(ROOT / '.env')
        tokens = [config.get(name) or '' for name in ('FORGEMIND_ADMIN_TOKEN', 'FORGEMIND_TECHNICIAN_TOKEN')]
        checks.append(('Distinct local role tokens configured', tokens[0] != tokens[1] and all(32 <= len(value) <= 512 and value.isascii() and not any(c.isspace() for c in value) for value in tokens)))
        endpoint = urlparse(config.get('AMD_TOKEN_FACTORY_URL') or '')
        checks.append(('AMD settings present (connectivity not tested)', bool(config.get('AMD_API_KEY') and config.get('AMD_MODEL') and endpoint.scheme == 'https' and endpoint.hostname and not endpoint.username and not endpoint.password)))
    for label, passed in checks:
        print(f'{"PASS" if passed else "NEEDS SETUP"}: {label}')
    try:
        with urlopen('http://127.0.0.1:8001/health', timeout=2) as response:
            health = json.load(response)
        print('RUNNING: Backend health ' + str(health.get('status', 'unknown')))
    except (OSError, ValueError):
        print('NOT RUNNING: Backend on port 8001 (start it after setup).')
    print('No AMD inference request was made. See INTEGRATION.md for setup and docs/JUDGE-DEMO.md for rehearsal.')
    return 0 if all(passed for _, passed in checks) else 1


if __name__ == '__main__':
    sys.exit(main())
