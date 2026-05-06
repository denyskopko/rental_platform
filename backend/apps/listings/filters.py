import django_filters
from .models import Listing


class ListingFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(
        field_name='price_per_night', lookup_expr='gte'
    )
    price_max = django_filters.NumberFilter(
        field_name='price_per_night', lookup_expr='lte'
    )
    rooms_min = django_filters.NumberFilter(
        field_name='rooms', lookup_expr='gte'
    )
    rooms_max = django_filters.NumberFilter(
        field_name='rooms', lookup_expr='lte'
    )

    class Meta:
        model  = Listing
        fields = [
            'city', 'district', 'property_type',
            'is_active', 'price_min', 'price_max',
            'rooms_min', 'rooms_max'
        ]