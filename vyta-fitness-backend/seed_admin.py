"""Run this to create an admin user: python seed_admin.py

This script creates an admin user in both Firebase Authentication
and the local PostgreSQL database with a hashed password.
"""
import asyncio
import os

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

import firebase_admin
from firebase_admin import credentials, auth

from app.core.config import settings
from app.core.admin_auth import hash_password
from app.models.admin import AdminRole
from app.models.user import User, UserRole


FIREBASE_CRED_PATH = os.path.join(
    os.path.dirname(__file__), "app", "core", "serviceAccountKey.json"
)
ADMIN_EMAIL = "codeforestinfo@gmail.com"
ADMIN_PASSWORD = "92075610"


async def main():
    # --- 1. Create Firebase user if not exists ---
    if not firebase_admin._apps:
        cred = credentials.Certificate(FIREBASE_CRED_PATH)
        firebase_admin.initialize_app(cred)

    firebase_uid = None
    try:
        fb_user = auth.create_user(email=ADMIN_EMAIL, password=ADMIN_PASSWORD)
        firebase_uid = fb_user.uid
        print(f"Firebase user created: {ADMIN_EMAIL} / uid={firebase_uid}")
    except auth.EmailAlreadyExistsError:
        fb_user = auth.get_user_by_email(ADMIN_EMAIL)
        firebase_uid = fb_user.uid
        print(f"Firebase user already exists: {ADMIN_EMAIL} / uid={firebase_uid}")

    if not firebase_uid:
        print("ERROR: Could not get Firebase uid")
        return

    # --- 2. Create local DB record ---
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.exec(
            select(User).where(User.email == ADMIN_EMAIL)
        )
        existing = result.one_or_none()
        if existing:
            updated = False
            if not existing.password_hash:
                existing.password_hash = hash_password(ADMIN_PASSWORD)
                updated = True
                print(f"Admin password hash updated: {ADMIN_EMAIL}")
            if existing.store_role != AdminRole.SUPER_ADMIN.value:
                existing.store_role = AdminRole.SUPER_ADMIN.value
                updated = True
                print(f"Admin store_role set to super_admin: {ADMIN_EMAIL}")
            if updated:
                session.add(existing)
                await session.commit()
            else:
                print(f"Admin already exists in DB: {ADMIN_EMAIL}")
            return

        user = User(
            id=firebase_uid,
            email=ADMIN_EMAIL,
            name="Admin",
            store_role=AdminRole.SUPER_ADMIN.value,
            role=UserRole.ADMIN,
            is_active=True,
            password_hash=hash_password(ADMIN_PASSWORD),
        )
        session.add(user)
        await session.commit()
        print(f"Admin created in DB: {ADMIN_EMAIL} (uid={firebase_uid})")


asyncio.run(main())
