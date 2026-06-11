from fastapi import APIRouter

from app.api.v1 import auth, vendors, customers, products, orders, admin

router = APIRouter()

router.include_router(auth.router)
router.include_router(vendors.router)
router.include_router(customers.router)
router.include_router(products.router)
router.include_router(orders.router)
router.include_router(admin.router)
