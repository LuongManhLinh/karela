from __future__ import annotations

from datetime import timedelta
from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, Field, conlist, confloat


# ---------- Enums ----------


class Variant(str, Enum):
    story = "story"
    ac = "ac"


class Polarity(str, Enum):
    allow = "allow"
    deny = "deny"
    require = "require"
    prevent = "prevent"


class CRUD(str, Enum):
    C = "C"
    R = "R"
    U = "U"
    D = "D"
    NA = "N/A"


class Modality(str, Enum):
    must = "must"
    should = "should"
    may = "may"


class Priority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class Operator(str, Enum):
    eq = "=="
    ne = "!="
    gt = ">"
    ge = ">="
    lt = "<"
    le = "<="
    contains = "in"
    matches = "matches"


class NfrOp(str, Enum):
    le = "<="
    ge = ">="
    eq = "=="
    within = "within"


class NfrScope(str, Enum):
    system = "system"
    feature = "feature"
    endpoint = "endpoint"


class EffectChange(str, Enum):
    create = "create"
    read = "read"
    update = "update"
    delete = "delete"
    enable = "enable"
    disable = "disable"
    grant = "grant"
    revoke = "revoke"
    notify = "notify"
    calculate = "calculate"
    transition = "transition"


class CanonVerb(str, Enum):
    login = "login"
    logout = "logout"
    enable = "enable"
    disable = "disable"
    allow = "allow"
    deny = "deny"
    view = "view"
    create = "create"
    update = "update"
    delete = "delete"
    export = "export"
    import_ = "import"
    notify = "notify"
    calculate = "calculate"
    schedule = "schedule"
    pay = "pay"
    refund = "refund"
    require = "require"
    prevent = "prevent"


class AmbiguityFlag(str, Enum):
    VAGUE_NFR_TERM = "VAGUE_NFR_TERM"
    MISSING_WHO = "MISSING_WHO"
    MISSING_WHAT = "MISSING_WHAT"
    MISSING_WHY = "MISSING_WHY"
    UNBOUNDED_QUANTIFIER = "UNBOUNDED_QUANTIFIER"
    UNSPECIFIED_CONDITION = "UNSPECIFIED_CONDITION"
    PRONOUN_REFERENCE = "PRONOUN_REFERENCE"
    MISSING_NFR_UNIT_OR_VALUE = "MISSING_NFR_UNIT_OR_VALUE"


# ---------- Atomic types ----------

JsonScalar = Union[str, int, float, bool]
JsonArray = List[JsonScalar]


class Actor(BaseModel):
    role: str
    qualifiers: List[str] = Field(default_factory=list)


class Action(BaseModel):
    verb_raw: str
    canonical: CanonVerb
    polarity: Polarity
    crud: Optional[CRUD] = None


class ObjectRef(BaseModel):
    entity: str
    attributes: List[str] = Field(default_factory=list)


class Cond(BaseModel):
    subject: str
    attr: Optional[str] = None
    op: Operator = Operator.eq
    value: Optional[Union[JsonScalar, JsonArray]] = None
    unit: Optional[str] = None


class Event(BaseModel):
    name: str
    params: List[str] = Field(default_factory=list)


class Effect(BaseModel):
    subject: str
    change: EffectChange
    target: Optional[str] = None
    to_state: Optional[str] = None


class NFR(BaseModel):
    metric: str
    op: NfrOp
    value: Optional[float] = None
    unit: Optional[str] = None
    scope: Optional[NfrScope] = None
    confidence: Optional[confloat(ge=0.0, le=1.0)] = None


class Temporal(BaseModel):
    before: Optional[str] = None  # EventRef by name/id
    after: Optional[str] = None  # EventRef by name/id
    within: Optional[timedelta] = None
    frequency: Optional[str] = None  # e.g., "daily", "hourly", "cron(0 2 * * *)"


class ScopeLink(BaseModel):
    epic: Optional[str] = None
    feature: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class Uncertainty(BaseModel):
    flags: List[AmbiguityFlag] = Field(default_factory=list)
    notes: Optional[str] = None


class Coverage(BaseModel):
    ac_ids: List[str] = Field(default_factory=list)


# ---------- Root aggregate ----------


class Story(BaseModel):
    id: str
    title: Optional[str] = None
    source_text: str
    variant: Variant

    actor: Actor
    action: Action
    object: ObjectRef

    conditions: List[Cond] = Field(default_factory=list)
    triggers: List[Event] = Field(default_factory=list)
    results: List[Effect] = Field(default_factory=list)

    nfrs: List[NFR] = Field(default_factory=list)
    temporal: Optional[Temporal] = None
    scope_link: Optional[ScopeLink] = None
    exceptions: List[Cond] = Field(default_factory=list)

    rationale: Optional[str] = None
    modality: Modality = Modality.should
    priority: Priority = Priority.P2

    uncertainty: Optional[Uncertainty] = None
    coverage: Optional[Coverage] = None

    class Config:
        from_attributes = True
