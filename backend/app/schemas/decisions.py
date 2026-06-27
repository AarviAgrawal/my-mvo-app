from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator


class EvidenceItem(BaseModel):
    label: str
    detail: str
    source: str   # 'PODs Sales' | 'SKU Sales' | 'Sales vs Spends' | 'Customer Survey'
    trend: Optional[str] = None  # 'up' | 'down' | 'flat'


class RawDataRef(BaseModel):
    source: str
    rows: list[dict[str, Any]]


class DecisionResponse(BaseModel):
    id: str
    action: str
    type: str       # 'grow'|'reduce'|'remove'|'monitor'|'spend'|'expand'
    severity: str   # 'low'|'medium'|'high'
    confidence: int
    flavour: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    platform: Optional[str] = None
    reasoning: str
    evidence: list[EvidenceItem] = Field(default_factory=list)
    rawDataRefs: list[RawDataRef] = Field(default_factory=list, alias='raw_data_refs')
    createdAt: str = Field(alias='created_at')

    model_config = {'populate_by_name': True}

    @model_validator(mode='before')
    @classmethod
    def parse_jsonb(cls, values: Any) -> Any:
        """Supabase returns JSONB columns as Python lists/dicts already parsed."""
        if isinstance(values, dict):
            if isinstance(values.get('evidence'), list):
                pass  # already parsed
            if isinstance(values.get('raw_data_refs'), list):
                pass
        return values
