"""Build a shareable source ZIP without local credentials or runtime data."""
from pathlib import Path
import zipfile

from dotenv import dotenv_values

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT.parent / 'ForgeMind-integrated-ready.zip'
EXCLUDED = {'.git', 'node_modules', '.venv', '__pycache__', '.pytest_cache', 'data', 'dist'}


def main():
    config = dotenv_values(ROOT / '.env')
    private_values = [value.encode() for key, value in config.items()
                      if value and ('KEY' in key or 'TOKEN' in key) and not key.endswith('URL')]
    files = []
    for path in ROOT.rglob('*'):
        relative = path.relative_to(ROOT)
        if not path.is_file() or any(part in EXCLUDED for part in relative.parts):
            continue
        if path.name == '.env' or (path.name.startswith('.env.') and path.name != '.env.example'):
            continue
        if path.suffix in {'.db', '.sqlite', '.sqlite3', '.pyc', '.log'}:
            continue
        if any(value in path.read_bytes() for value in private_values):
            raise RuntimeError('Private credential detected; packaging stopped')
        files.append((path, relative))
    with zipfile.ZipFile(OUTPUT, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path, relative in files:
            archive.write(path, Path('ForgeMind-integrated') / relative)
    with zipfile.ZipFile(OUTPUT) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('Archive integrity check failed')
    print(f'Verified source archive: {OUTPUT.name}; {len(files)} files; credentials and databases excluded.')


if __name__ == '__main__':
    main()
