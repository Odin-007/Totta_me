"""SQLAlchemy engine/session setup and custom column types.

Works against both SQLite (local/dev, tests) and Postgres (DATABASE_URL controls which).
"""

import json

from sqlalchemy import create_engine, inspect, String, text, Text, TypeDecorator
from sqlalchemy.orm import declarative_base, sessionmaker

from config import DATABASE_URL


def get_engine_args(database_url: str):
    args = {
        "echo": False,
        "pool_pre_ping": True,
    }

    if database_url.startswith("sqlite"):
        args["connect_args"] = {"check_same_thread": False}

    return args


engine = create_engine(DATABASE_URL, **get_engine_args(DATABASE_URL))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class GUID(TypeDecorator):
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)


class JSONList(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value or [])

    def process_result_value(self, value, dialect):
        if not value:
            return []
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return []


def sync_missing_columns(bind, base):
    """Add columns that exist on the models but not on the live tables.

    create_all() only creates tables that don't exist yet - it never alters
    existing ones, so a column added to a model silently never reaches the
    database. This adds them in place instead of requiring a full migration
    tool.
    """
    inspector = inspect(bind)
    with bind.begin() as conn:
        for table in base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing_columns = {col["name"] for col in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_columns:
                    continue
                column_type = column.type.compile(dialect=bind.dialect)
                conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {column_type}'))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
