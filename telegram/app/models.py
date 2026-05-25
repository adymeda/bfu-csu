from datetime import datetime, timezone
from sqlalchemy import BigInteger, String, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from .db import Base

class PendingLink(Base):
    __tablename__ = "pending_links"

    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    code: Mapped[str] = mapped_column(String(16), nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), default=lambda: datetime.now(timezone.utc)
    )

class Link:
    user_id: int
    link_type: int
    link_value: str