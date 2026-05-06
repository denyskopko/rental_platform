from django.db import models



class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING   = 'pending',   'Ожидает подтверждения'
        CONFIRMED = 'confirmed', 'Подтверждено'
        CANCELLED = 'cancelled', 'Отменено'
        COMPLETED = 'completed', 'Завершено'

    listing    = models.ForeignKey(
        "listings.Listing",
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    tenant     = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='bookings',
        limit_choices_to={'role': 'tenant'},
    )
    check_in   = models.DateField()
    check_out  = models.DateField()
    status     = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.tenant.email} — {self.listing.title} ({self.status})'

    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'


class Review(models.Model):
    listing    = models.ForeignKey(
        "listings.Listing",
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    booking    = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review',
    )
    author     = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    rating     = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],  # 1-5
    )
    comment    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.author.email} — {self.listing.title} ({self.rating}★)'

    class Meta:
        db_table = 'reviews'
        ordering = ['-created_at']
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'