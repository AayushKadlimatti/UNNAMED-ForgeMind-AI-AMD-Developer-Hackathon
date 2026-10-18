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

    def save_audited(self, kind, payload, workflow_db, user, action, details, *, immutable=False, critical_machine=None, replace_existing=False, extra_audits=()):
        """Save a reference/external report AND its audit using one attached-SQLite transaction.

        No new tables: reuses the existing events and workflow audit_logs tables.
        Both databases must be file-backed SQLite on persistent local storage.
        immutable makes external_id retries return the original without a second audit.
        This does not change the existing AMD work-order cross-store recovery logic.
        """
        from datetime import datetime, timezone
        from fastapi import HTTPException

        workflow_path = workflow_db.get_bind().url.database
        if not workflow_path or workflow_path == ':memory:':
            raise HTTPException(503, 'Audited event storage requires file-backed SQLite databases')
        if Path(workflow_path).resolve() == Path(self.path).resolve():
            raise HTTPException(503, 'Configure separate event and workflow SQLite files')
        timestamp = datetime.now(timezone.utc).replace(tzinfo=None).isoformat(sep=' ')
        try:
            with self.db() as connection:
                connection.execute('ATTACH DATABASE ? AS workflow_audit', (str(Path(workflow_path).resolve()),))
                connection.execute('BEGIN IMMEDIATE')
                if immutable:
                    row = connection.execute('SELECT payload FROM events WHERE id=?', (payload['id'],)).fetchone()
                    if row:
                        existing = json.loads(row[0])
                        if existing.get('submission_hash') != payload.get('submission_hash'):
                            raise HTTPException(409, 'external_id already exists with different diagnosis data')
                        return existing, False
                statement = 'INSERT INTO events(kind,id,payload) VALUES (?,?,?)'
                if replace_existing:
                    statement += ' ON CONFLICT(id) DO UPDATE SET payload=excluded.payload'
                connection.execute(statement, (kind, payload['id'], json.dumps(payload, allow_nan=False)))
                def audit(event, metadata):
                    connection.execute('INSERT INTO workflow_audit.audit_logs(username,action,details,timestamp) VALUES (?,?,?,?)',
                                       (user.username, event, json.dumps(metadata, sort_keys=True), timestamp))
                audit(action, details)
                if critical_machine:
                    connection.execute("UPDATE workflow_audit.machines SET status='CRITICAL' WHERE id=?", (critical_machine,))
                    audit('MACHINE_STATUS_CHANGED', {'machine_id': critical_machine, 'to': 'CRITICAL', 'source': 'external_report'})
                for event, metadata in extra_audits:
                    audit(event, metadata)
            return payload, True
        except sqlite3.Error:
            # Do not leak database paths, SQL, submitted text, or credential values.
            raise HTTPException(503, 'Audited storage failed; no event was saved. Retry after checking local storage.') from None
