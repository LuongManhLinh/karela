"""Database query functions for the taxonomy service."""

from sqlalchemy.orm import Session

from .models import Bucket, BucketItem
from .schemas import TaxonomyResponse
from common.database import uuid_generator


def get_story_tags(
    db: Session, connection_id: str, project_key: str, story_key: str
) -> list[str]:
    """Return bucket tag names for a specific story."""
    rows = (
        db.query(Bucket.tag)
        .join(BucketItem, BucketItem.bucket_id == Bucket.id)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
            BucketItem.story_key == story_key,
        )
        .all()
    )
    return [r[0] for r in rows]


def get_stories_by_tags(
    db: Session, connection_id: str, project_key: str, tag_names: list[str]
) -> list[str]:
    """Return unique story keys belonging to any of the given tags."""
    rows = (
        db.query(BucketItem.story_key)
        .join(Bucket, BucketItem.bucket_id == Bucket.id)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
            Bucket.tag.in_(tag_names),
        )
        .distinct()
        .all()
    )
    return [r[0] for r in rows]


def get_all_buckets(db: Session, connection_id: str, project_key: str) -> list[Bucket]:
    """Return all buckets for a project."""
    return (
        db.query(Bucket)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
        )
        .all()
    )


def _query_bucket_by_tag(
    db: Session, connection_id: str, project_key: str, tag: str
) -> Bucket | None:
    """Helper to query a single bucket by tag name."""
    return (
        db.query(Bucket)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
            Bucket.tag == tag,
        )
        .first()
    )


def upsert_buckets_and_items(
    db: Session,
    connection_id: str,
    project_key: str,
    response: TaxonomyResponse,
):
    """Persist a TaxonomyResponse: create new buckets, update descriptions, insert items."""

    tag_to_bucket = {
        bucket.tag: bucket for bucket in get_all_buckets(db, connection_id, project_key)
    }

    for nb in response.new_buckets:
        bucket = tag_to_bucket.get(nb.name)
        if bucket:
            bucket.description = f"{bucket.description}\n\n[Update] {nb.description}"
        else:
            bucket = Bucket(
                id=uuid_generator(),
                connection_id=connection_id,
                project_key=project_key,
                tag=nb.name,
                description=nb.description,
            )
            db.add(bucket)
            tag_to_bucket[nb.name] = bucket

    # 2. Apply description updates
    for bu in response.bucket_updates:
        bucket = tag_to_bucket.get(bu.name)
        if bucket:
            bucket.description = bu.updated_description
        else:
            bucket = Bucket(
                id=uuid_generator(),
                connection_id=connection_id,
                project_key=project_key,
                tag=bu.name,
                description=bu.updated_description,
            )
            db.add(bucket)
            tag_to_bucket[bu.name] = bucket

    # 4. Insert bucket items
    for cat in response.categorizations:
        seen_tags: set[str] = set()
        for tag_name in cat.tags:
            if tag_name in seen_tags:
                continue
            seen_tags.add(tag_name)

            bucket = tag_to_bucket.get(tag_name)
            if not bucket:
                # LLM referenced a tag it didn't create — auto-create it
                bucket = Bucket(
                    id=uuid_generator(),
                    connection_id=connection_id,
                    project_key=project_key,
                    tag=tag_name,
                    description="",
                )
                db.add(bucket)
                db.flush()
                tag_to_bucket[tag_name] = bucket

            item = BucketItem(
                bucket_id=bucket.id,
                story_key=cat.key,
            )
            db.add(item)

    db.commit()


def drop_all_buckets(db: Session, connection_id: str, project_key: str) -> None:
    """Delete all buckets (and cascade items) for a project."""
    db.query(Bucket).filter(
        Bucket.connection_id == connection_id,
        Bucket.project_key == project_key,
    ).delete(synchronize_session="fetch")
    db.commit()


def get_project_stories_tags(
    db: Session, connection_id: str, project_key: str
) -> tuple[dict[str, set[str]], dict[str, set[str]]]:
    """Return a mapping of story keys to their bucket tags for a project."""
    rows = (
        db.query(BucketItem.story_key, Bucket.tag)
        .join(Bucket, BucketItem.bucket_id == Bucket.id)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
        )
        .all()
    )
    story_to_tags = {}
    tag_to_stories = {}
    for story_key, tag in rows:
        story_to_tags.setdefault(story_key, set()).add(tag)
        tag_to_stories.setdefault(tag, set()).add(story_key)
    return story_to_tags, tag_to_stories
