from django.contrib import admin
from .models import Listing, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 1


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display   = [
        'title', 'city', 'property_type',
        'price_per_night', 'rooms', 'is_active', 'view_count'
    ]
    list_filter    = ['property_type', 'is_active', 'city']
    search_fields  = ['title', 'description', 'city']
    list_editable  = ['is_active']
    inlines        = [ListingImageInline]
    readonly_fields = ['view_count', 'avg_rating', 'created_at', 'updated_at']
