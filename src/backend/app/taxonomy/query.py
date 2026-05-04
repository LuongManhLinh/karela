"""Database query functions for the taxonomy service."""

from sqlalchemy.orm import Session

from .models import Bucket, BucketItem
from .schemas import NewBucket, StoryCategorization
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
    all_bucket: list[NewBucket],
    categorizations: list[StoryCategorization],
):
    """Persist a TaxonomyResponse: create new buckets, update descriptions, insert items."""

    rows = (
        db.query(BucketItem, Bucket)
        .join(Bucket, BucketItem.bucket_id == Bucket.id)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
        )
        .all()
    )

    tag_to_bucket = {}
    key_to_tags = {}
    for item, bucket in rows:
        tag_to_bucket[bucket.tag] = bucket
        key_to_tags.setdefault(item.story_key, set()).add(bucket.tag)

    # Upsert buckets
    for bucket in all_bucket:
        existing = tag_to_bucket.get(bucket.name)
        if existing:
            if existing.description != bucket.description:
                existing.description = bucket.description
                db.add(existing)
        else:
            new_bucket = Bucket(
                id=uuid_generator(),
                connection_id=connection_id,
                project_key=project_key,
                tag=bucket.name,
                description=bucket.description,
            )
            db.add(new_bucket)
            tag_to_bucket[bucket.name] = new_bucket  # Add to dict for item upsert

    for cat in categorizations:
        for tag in cat.tags:
            bucket = tag_to_bucket.get(tag)
            if not bucket:
                continue  # Skip tags that weren't created/updated (shouldn't happen)
            existing_tags: set = key_to_tags.get(cat.key, set())
            if tag not in existing_tags:
                item = BucketItem(
                    id=uuid_generator(),
                    bucket_id=bucket.id,
                    story_key=cat.key,
                )
                db.add(item)
                existing_tags.add(tag)  # Update the set to prevent duplicates

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


def delete_buckets_by_story_keys(
    db: Session, connection_id: str, project_key: str, story_keys: list[str]
) -> None:
    """Delete buckets associated with any of the given story keys."""
    items = (
        db.query(BucketItem)
        .join(Bucket, BucketItem.bucket_id == Bucket.id)
        .filter(
            Bucket.connection_id == connection_id,
            Bucket.project_key == project_key,
            BucketItem.story_key.in_(story_keys),
        )
        .all()
    )

    for item in items:
        db.delete(item.bucket)  # This will cascade and delete the item as well
    db.commit()
