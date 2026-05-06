from django.db import models


class AIChatSession(models.Model):
    user             = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='chat_sessions',
    )
    messages         = models.JSONField(default=list)
    extracted_params = models.JSONField(null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Сессия {self.user.email} — {self.created_at:%d.%m.%Y %H:%M}'

    class Meta:
        db_table = 'ai_chat_sessions'
        ordering = ['-created_at']
        verbose_name = 'AI чат сессия'
        verbose_name_plural = 'AI чат сессии'


class SearchHistory(models.Model):
    user              = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='search_history',
    )
    keyword           = models.CharField(max_length=200)
    search_count      = models.PositiveIntegerField(default=1)
    last_searched_at  = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.email} — {self.keyword} ({self.search_count})'

    class Meta:
        db_table = 'search_history'
        ordering = ['-search_count']
        unique_together = ['user', 'keyword']
        verbose_name = 'История поиска'
        verbose_name_plural = 'История поиска'


class ViewHistory(models.Model):
    listing   = models.ForeignKey(
        'listings.Listing',
        on_delete=models.CASCADE,
        related_name='view_history',
    )
    user      = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='view_history',
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} — {self.listing.title}'

    class Meta:
        db_table = 'view_history'
        ordering = ['-viewed_at']
        verbose_name = 'История просмотров'
        verbose_name_plural = 'История просмотров'