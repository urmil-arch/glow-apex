import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.blog.repository import BlogRepository
from app.blog.schemas import BlogCreate, BlogListResponse, BlogResponse, BlogUpdate
from app.user_management.utils.dependencies import require_permission
from app.user_management.utils.permissions import PERM_BLOGS

logger = logging.getLogger(__name__)

# Public routes — no authentication required
public_router = APIRouter()

# Admin routes — admin JWT required on every endpoint
admin_router = APIRouter(dependencies=[Depends(require_permission(PERM_BLOGS))])


# ── Public endpoints ───────────────────────────────────────────────────────────

@public_router.get("", response_model=BlogListResponse)
async def list_posts(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=100),
    category: str = Query(""),
    search: str = Query(""),
) -> BlogListResponse:
    """Return paginated published blog posts."""
    db = request.app.state.db
    posts, total = await BlogRepository(db).find_all_public(page, page_size, category, search)
    return BlogListResponse(posts=posts, total=total, page=page, page_size=page_size)


@public_router.get("/{slug}", response_model=BlogResponse)
async def get_post(slug: str, request: Request) -> BlogResponse:
    """Return a single published blog post by slug."""
    db = request.app.state.db
    post = await BlogRepository(db).find_by_slug_public(slug)
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog post not found")
    return BlogResponse(**post)


@public_router.get("/{slug}/related", response_model=list[BlogResponse])
async def get_related(slug: str, request: Request) -> list[BlogResponse]:
    """Return up to 3 related published posts in the same category."""
    db = request.app.state.db
    posts = await BlogRepository(db).find_related(slug, limit=3)
    return [BlogResponse(**p) for p in posts]


# ── Admin endpoints ────────────────────────────────────────────────────────────

@admin_router.get("", response_model=BlogListResponse)
async def admin_list_posts(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    published: Optional[bool] = Query(None),
) -> BlogListResponse:
    """Return all blog posts (including drafts) for admin management."""
    db = request.app.state.db
    posts, total = await BlogRepository(db).find_all_admin(page, page_size, published)
    return BlogListResponse(posts=posts, total=total, page=page, page_size=page_size)


@admin_router.post("", response_model=BlogResponse, status_code=status.HTTP_201_CREATED)
async def create_post(body: BlogCreate, request: Request) -> BlogResponse:
    """Create a new blog post."""
    db = request.app.state.db
    repo = BlogRepository(db)
    if await repo.slug_exists(body.slug):
        raise HTTPException(status.HTTP_409_CONFLICT, "A post with this slug already exists")
    now = datetime.now(timezone.utc)
    doc = {**body.model_dump(), "created_at": now, "updated_at": now}
    post_id = await repo.insert(doc)
    post = await repo.find_by_id(post_id)
    logger.info("Blog post created: slug=%s id=%s", body.slug, post_id)
    return BlogResponse(**post)


@admin_router.patch("/{post_id}", response_model=BlogResponse)
async def update_post(post_id: str, body: BlogUpdate, request: Request) -> BlogResponse:
    """Update an existing blog post."""
    db = request.app.state.db
    repo = BlogRepository(db)
    post = await repo.find_by_id(post_id)
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog post not found")
    updates = body.model_dump(exclude_unset=True)
    if "slug" in updates and updates["slug"] != post["slug"]:
        if await repo.slug_exists(updates["slug"], exclude_id=post_id):
            raise HTTPException(status.HTTP_409_CONFLICT, "A post with this slug already exists")
    updates["updated_at"] = datetime.now(timezone.utc)
    await repo.update(post_id, updates)
    updated = await repo.find_by_id(post_id)
    return BlogResponse(**updated)


@admin_router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: str, request: Request) -> None:
    """Delete a blog post permanently."""
    db = request.app.state.db
    deleted = await BlogRepository(db).delete(post_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Blog post not found")
    logger.info("Blog post deleted: id=%s", post_id)
