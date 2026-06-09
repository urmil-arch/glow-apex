from typing import Optional
from pydantic import BaseModel


class BlogCreate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    tags: list[str] = []
    author_name: str = "BuyRealViews Team"
    author_avatar: str = ""
    read_time: str = "5 min read"
    image_url: str = ""
    date: str
    published: bool = True


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[list[str]] = None
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
    read_time: Optional[str] = None
    image_url: Optional[str] = None
    date: Optional[str] = None
    published: Optional[bool] = None


class BlogResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    tags: list[str]
    author_name: str
    author_avatar: str
    read_time: str
    image_url: str
    date: str
    published: bool
    created_at: str
    updated_at: str


class BlogListResponse(BaseModel):
    posts: list[BlogResponse]
    total: int
    page: int
    page_size: int
