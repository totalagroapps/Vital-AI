"""Crea (o promueve) una cuenta de verificador/administrador.

Uso:  python -m scripts.create_verifier <usuario> <contraseña> [verifier|admin]
Los verificadores ya no pueden autoregistrarse desde la app.
"""
import asyncio
import sys

from sqlalchemy import select

import database
import models
from security import get_password_hash


async def main(username: str, password: str, role: str):
    async with database.AsyncSessionLocal() as session:
        user = (await session.execute(select(models.User).where(models.User.username == username))).scalars().first()
        if user:
            user.role = role
            user.hashed_password = get_password_hash(password)
            print(f"Usuario existente '{username}' actualizado con rol '{role}'.")
        else:
            session.add(models.User(username=username, hashed_password=get_password_hash(password), role=role))
            print(f"Usuario '{username}' creado con rol '{role}'.")
        await session.commit()


if __name__ == "__main__":
    if len(sys.argv) < 3 or (len(sys.argv) > 3 and sys.argv[3] not in ("verifier", "admin")):
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1].strip().lower(), sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "verifier"))
