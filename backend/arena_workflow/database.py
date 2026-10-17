"""One engine per application; one shared dependency session per request."""
import os
from pathlib import Path

from fastapi import Request
from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def build_database(database_url: str | None = None):
    url = database_url or os.getenv("FORGEMIND_WORKFLOW_DATABASE_URL", "sqlite:///./forgemind_workflow.db")
    parsed = make_url(url)
    if parsed.get_backend_name() != "sqlite":
        raise ValueError("This starter supports SQLite database URLs only.")
    if parsed.database and parsed.database != ":memory:":
        Path(parsed.database).expanduser().resolve().parent.mkdir(parents=True, exist_ok=True)
    options = {"poolclass": StaticPool} if parsed.database in (None, "", ":memory:") else {}
    engine = create_engine(url, connect_args={"check_same_thread": False, "timeout": 10}, **options)

    @event.listens_for(engine, "connect")
    def configure_sqlite(connection, _):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()

    return engine, sessionmaker(bind=engine, expire_on_commit=False)


def get_db(request: Request):
    # FastAPI caches this dependency, including when authorization also needs it.
    with request.app.state.arena_session_factory() as session:
        try:
            yield session
        finally:
            session.rollback()  # harmless after commit; discards unfinished work
