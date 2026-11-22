from sqlalchemy import create_engine, Engine, text
from sqlalchemy.engine import Connection
from typing import Generator
import urllib.parse
from settings import Settings, get_settings

_engine: Engine | None = None


def init_engine(settings: Settings) -> Engine:
    global _engine
    encoded_password = urllib.parse.quote_plus(settings.db_password)
    url = (
        f"mysql+pymysql://{settings.db_user}:{encoded_password}@"
        f"{settings.db_host}:{settings.db_port}/{settings.db_name}?charset=utf8mb4"
    )
    _engine = create_engine(
        url,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20,
    )
    return _engine


def get_engine() -> Engine:
    global _engine
    if _engine is None:
        _engine = init_engine(get_settings())
    return _engine


def get_db() -> Generator[Connection, None, None]:
    """FastAPI dependency yielding a raw database connection per request."""
    engine = get_engine()
    with engine.connect() as conn:
        yield conn
