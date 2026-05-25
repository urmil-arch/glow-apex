from typing import Literal

from pydantic import BaseModel, EmailStr


class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str
    type: Literal["support", "business"]
