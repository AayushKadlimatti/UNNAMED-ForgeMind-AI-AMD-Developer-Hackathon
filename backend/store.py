import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path


class Store:
    def __init__(self, path):
        self.path = str(path)
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with self.db() as db:
            db.execute('CREATE TABLE IF NOT EXISTS events (seq INTEGER PRIMARY KEY, kind TEXT, id TEXT UNIQUE, payload TEXT)')
        for item in self.list('diagnosis', 10000):
            if item['status'] == 'pending':
                item.update(status='unavailable', message='Server restarted during analysis. Retry manually.')
                self.save('diagnosis', item)

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=10)
        try:
            with db:
                yield db
        finally:
            db.close()

    def save(self, kind, payload):
        with self.db() as db:
            db.execute('INSERT INTO events(kind,id,payload) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload', (kind, payload['id'], json.dumps(payload)))
            if kind == 'telemetry':
                db.execute("DELETE FROM events WHERE kind='telemetry' AND seq NOT IN (SELECT seq FROM events WHERE kind='telemetry' ORDER BY seq DESC LIMIT 300)")

    def get(self, id):
        with self.db() as db:
            row = db.execute('SELECT payload FROM events WHERE id=?', (id,)).fetchone()
        return json.loads(row[0]) if row else None

    def list(self, kind, limit=50):
        with self.db() as db:
            rows = db.execute('SELECT payload FROM events WHERE kind=? ORDER BY seq DESC LIMIT ?', (kind, limit)).fetchall()
        return [json.loads(row[0]) for row in rows]
