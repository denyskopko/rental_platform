from django.contrib import admin
from .models import Booking, Review


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = [
        'id', 'listing', 'tenant',
        'check_in', 'check_out', 'status'
    ]
    list_filter   = ['status']
    search_fields = ['listing__title', 'tenant__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ['listing', 'author', 'rating', 'created_at']
    list_filter   = ['rating']
    search_fields = ['listing__title', 'author__email']
    readonly_fields = ['created_at']