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


class Base(DeclarativeBase):
    pass


from sqlalchemy import event, select, text, Integer
from sqlalchemy.orm import object_session

@event.listens_for(Base, "before_insert", propagate=True)
def before_insert_listener(mapper, connection, target):
    pk_cols = mapper.primary_key
    if len(pk_cols) != 1:
        return
    
    pk_col = pk_cols[0]
    if not isinstance(pk_col.type, Integer):
        return
        
    pk_name = pk_col.name
    current_val = getattr(target, pk_name, None)
    
    if current_val is None or current_val == 0:
        # 1. Get IDs from DB
        stmt = select(pk_col).order_by(pk_col)
        result = connection.execute(stmt).fetchall()
        existing_ids = [row[0] for row in result if row[0] is not None and row[0] > 0]
        
        # 2. Get IDs from other pending objects in session
        session = object_session(target)
        session_pending_ids = set()
        if session:
            for obj in session.new:
                if isinstance(obj, target.__class__) and obj is not target:
                    val = getattr(obj, pk_name, None)
                    if val is not None and val > 0:
                        session_pending_ids.add(val)
                        
        all_ids = set(existing_ids).union(session_pending_ids)
        
        # 3. Find first gap
        next_id = 1
        while next_id in all_ids:
            next_id += 1
            
        setattr(target, pk_name, next_id)
        
        # 4. Sync PostgreSQL sequence if applicable
        if connection.dialect.name == "postgresql":
            table_name = mapper.local_table.name
            seq_name = f"{table_name}_{pk_name}_seq"
            try:
                max_id = max(all_ids) if all_ids else 0
                new_seq_val = max(next_id, max_id)
                connection.execute(text(f"SELECT setval('{seq_name}', {new_seq_val}, true)"))
            except Exception:
                pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_rental_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()