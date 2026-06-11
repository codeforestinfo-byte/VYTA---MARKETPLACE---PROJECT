from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.database import get_session
from app.core.dependencies import RoleChecker
from app.models.product import Product
from app.models.user import User, UserRole
from app.models.vendor import Vendor

router = APIRouter(tags=["Products"])


class ProductCreateRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    price: Decimal
    stock_quantity: int = 0
    image_url: Optional[str] = None


class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class ProductResponse(BaseModel):
    id: str
    vendor_id: str
    name: str
    description: str
    price: float
    stock_quantity: int
    image_url: Optional[str] = None
    is_available: bool
    created_at: datetime


@router.get("/products", response_model=List[ProductResponse])
async def list_products(
    vendor_id: Optional[uuid.UUID] = Query(None),
    is_available: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    query = select(Product)

    if vendor_id:
        query = query.where(Product.vendor_id == vendor_id)
    if is_available is not None:
        query = query.where(Product.is_available == is_available)
    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))

    query = query.order_by(Product.name)
    result = await session.exec(query)
    products = result.all()

    return [
        ProductResponse(
            id=str(p.id),
            vendor_id=str(p.vendor_id),
            name=p.name,
            description=p.description or "",
            price=float(p.price),
            stock_quantity=p.stock_quantity,
            image_url=p.image_url,
            is_available=p.is_available,
            created_at=p.created_at,
        )
        for p in products
    ]


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return ProductResponse(
        id=str(product.id),
        vendor_id=str(product.vendor_id),
        name=product.name,
        description=product.description or "",
        price=float(product.price),
        stock_quantity=product.stock_quantity,
        image_url=product.image_url,
        is_available=product.is_available,
        created_at=product.created_at,
    )


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    body: ProductCreateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    vendor_result = await session.exec(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = vendor_result.one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")

    product = Product(
        vendor_id=vendor.id,
        name=body.name,
        description=body.description or "",
        price=body.price,
        stock_quantity=body.stock_quantity,
        image_url=body.image_url,
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)

    return ProductResponse(
        id=str(product.id),
        vendor_id=str(product.vendor_id),
        name=product.name,
        description=product.description or "",
        price=float(product.price),
        stock_quantity=product.stock_quantity,
        image_url=product.image_url,
        is_available=product.is_available,
        created_at=product.created_at,
    )


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    body: ProductUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    vendor_result = await session.exec(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = vendor_result.one_or_none()
    if not vendor or product.vendor_id != vendor.id:
        raise HTTPException(status_code=403, detail="Not your product")

    if body.name is not None:
        product.name = body.name
    if body.description is not None:
        product.description = body.description
    if body.price is not None:
        product.price = body.price
    if body.stock_quantity is not None:
        product.stock_quantity = body.stock_quantity
    if body.image_url is not None:
        product.image_url = body.image_url
    if body.is_available is not None:
        product.is_available = body.is_available

    session.add(product)
    await session.commit()
    await session.refresh(product)

    return ProductResponse(
        id=str(product.id),
        vendor_id=str(product.vendor_id),
        name=product.name,
        description=product.description or "",
        price=float(product.price),
        stock_quantity=product.stock_quantity,
        image_url=product.image_url,
        is_available=product.is_available,
        created_at=product.created_at,
    )


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(RoleChecker([UserRole.VENDOR])),
):
    product = await session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    vendor_result = await session.exec(
        select(Vendor).where(Vendor.user_id == current_user.id)
    )
    vendor = vendor_result.one_or_none()
    if not vendor or product.vendor_id != vendor.id:
        raise HTTPException(status_code=403, detail="Not your product")

    await session.delete(product)
    await session.commit()
