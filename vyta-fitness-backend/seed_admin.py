"""Run this to create an admin user: python seed_admin.py"""
import asyncio
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole

async def main():
    engine = create_async_engine(settings.DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.exec(select(User).where(User.email == "codeforestinfo@gmail.com"))
        existing = result.one_or_none()
        if existing:
            print("Admin already exists")
            return
        
        user = User(
            email="codeforestinfo@gmail.com",
            password_hash=hash_password("92075610"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        session.add(user)
        await session.commit()
        print("Admin created: codeforestinfo@gmail.com / 92075610")

asyncio.run(main())
