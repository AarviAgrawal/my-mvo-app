from typing import Any, Literal

from pydantic import BaseModel

DataType = Literal['sku_sales', 'pods_sales', 'sales_spends', 'survey_responses', 'decisions']


class ImportRequest(BaseModel):
    data: list[dict[str, Any]]


class ImportResponse(BaseModel):
    type: str
    rowsInserted: int
    errors: list[str] = []
