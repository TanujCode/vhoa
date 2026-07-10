from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings


db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# --- RENTAL DB SETUP ---
rental_db_url = settings.RENTAL_DATABASE_URL
if rental_db_url.startswith("postgres://"):
    rental_db_url = rental_db_url.replace("postgres://", "postgresql://", 1)

rental_engine = create_engine(
    rental_db_url,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
)
RentalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=rental_engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_rental_db():
    db = RentalSessionLocal()
    try:
        yield db
    finally:
        db.close()