#!/usr/bin/env python3
"""
Reset relationship analyses to recalculate with new scoring engine.
Run on server: python scripts/reset_relationship_analyses.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.base import SessionLocal
from sqlalchemy import text


def reset_analyses():
    db = SessionLocal()
    try:
        # Count existing
        result = db.execute(text('SELECT COUNT(*) FROM relationship_analyses'))
        count = result.scalar()
        print(f'Found {count} relationship analyses')

        if count == 0:
            print('No analyses to delete')
            return

        # Delete all
        db.execute(text('DELETE FROM relationship_analyses'))
        db.commit()
        print(f'Deleted {count} relationship analyses')
        print('')
        print('To regenerate, users can:')
        print('1. Open the app and view any relationship')
        print('2. Or call the API: POST /relationships/{person_id}/analyze')

    except Exception as e:
        print(f'Error: {e}')
        db.rollback()
    finally:
        db.close()


if __name__ == '__main__':
    reset_analyses()
