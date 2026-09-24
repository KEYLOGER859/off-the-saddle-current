from datetime import datetime
from decimal import Decimal
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

Price = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=2)]


class ImageRef(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    id: str = Field(min_length=1, max_length=100)
    alt: str = Field(default='', max_length=300)
    caption: str = Field(default='', max_length=500)


class ProductWrite(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=160)
    chronicle_number: int | None = Field(default=None, ge=1, le=2147483647, strict=True)
    price: Price
    description: str = Field(default='', max_length=12000)
    origin: str = Field(default='', max_length=200)
    material: str = Field(default='', max_length=300)
    maker: str = Field(default='', max_length=200)
    sku: str = Field(min_length=1, max_length=80, pattern=r'^[a-zA-Z0-9._-]+$')
    stock_quantity: int = Field(default=0, ge=0, le=2147483647, strict=True)
    published: bool = False
    images: list[ImageRef] = Field(default_factory=list, max_length=20)

    @field_validator('sku')
    @classmethod
    def normalize_sku(cls, value):
        return value.upper()

    @model_validator(mode='after')
    def validate_publication(self):
        if len({image.id for image in self.images}) != len(self.images):
            raise ValueError('Each image may only appear once on a product')
        if self.published and (not self.images or not self.description or not self.origin or not self.material):
            raise ValueError('Published products require an image, description, origin and material')
        return self


class ProductUpdate(ProductWrite):
    version: int = Field(ge=1, strict=True)


class ProductImage(ImageRef):
    url: str
    width: int
    height: int


class ProductOut(BaseModel):
    id: str
    name: str
    chronicle_number: int
    price: str
    price_minor: int
    currency: str
    description: str
    origin: str
    material: str
    maker: str
    sku: str
    stock_quantity: int
    published: bool
    images: list[ProductImage]
    created_at: datetime
    updated_at: datetime
    version: int


class ProductPage(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
    has_more: bool