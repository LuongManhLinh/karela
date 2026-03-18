import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from common.database import engine
from sqlalchemy import text
with engine.connect() as con:
    try:
        con.execute(text("ALTER TABLE analyses ADD COLUMN generating_proposals BOOLEAN NOT NULL DEFAULT 0;"))
        con.commit()
        print("Column added successfully!")
    except Exception as e:
        print("Error or already exists:", e)
