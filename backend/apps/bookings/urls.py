from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, ReviewViewSet

from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, ReviewViewSet

router = DefaultRouter()
router.register('', BookingViewSet, basename='booking')

reviews_router = DefaultRouter()
reviews_router.register('', ReviewViewSet, basename='review')

urlpatterns = router.urls + reviews_router.urls