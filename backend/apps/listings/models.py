from django.db import models


class Listing(models.Model):
    class PropertyType(models.TextChoices):
        APARTMENT = 'apartment', 'Квартира'
        HOUSE     = 'house',     'Дом'
        STUDIO    = 'studio',    'Студия'
        ROOM      = 'room',      'Комната'

    owner           = models.ForeignKey(
        "users.User",
        on_delete=models.CASCADE,
        related_name='listings',
        limit_choices_to={'role': 'landlord'},
    )
    title           = models.CharField(max_length=200)
    description     = models.TextField()
    city            = models.CharField(max_length=100)
    district        = models.CharField(max_length=100, blank=True, default='')
    property_type   = models.CharField(
        max_length=20,
        choices=PropertyType.choices,
    )
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2)
    rooms           = models.PositiveIntegerField()
    is_active       = models.BooleanField(default=True)
    view_count      = models.PositiveIntegerField(default=0)
    avg_rating      = models.FloatField(default=0.0)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.title} — {self.city}'

    class Meta:
        db_table = 'listings'
        ordering = ['-created_at']
        verbose_name = 'Объявление'
        verbose_name_plural = 'Объявления'


class ListingImage(models.Model):
    listing = models.ForeignKey(
        Listing,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image   = models.ImageField(upload_to='listings/')
    order   = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'Фото {self.order} — {self.listing.title}'

    class Meta:
        db_table = 'listing_images'
        ordering = ['order']
        verbose_name = 'Фото объявления'
        verbose_name_plural = 'Фото объявлений'