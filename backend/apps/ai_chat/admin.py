from django.contrib import admin
from .models import AIChatSession


@admin.register(AIChatSession)
class AIChatSessionAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['messages', 'extracted_params', 'created_at']
