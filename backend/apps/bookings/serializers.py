from rest_framework import serializers
from .models import Booking, Review
from apps.listings.serializers import ListingShortSerializer


class BookingSerializer(serializers.ModelSerializer):
    listing_info = ListingShortSerializer(
        source='listing',
        read_only=True
    )
    tenant_email = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = [
            'id', 'listing', 'listing_info',
            'tenant', 'tenant_email',
            'check_in', 'check_out',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'tenant', 'status',
            'created_at', 'updated_at'
        ]

    def get_tenant_email(self, obj):
        return obj.tenant.email

    def validate(self, attrs):
        check_in  = attrs.get('check_in')
        check_out = attrs.get('check_out')

        # check_out должен быть позже check_in
        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError(
                    {'check_out': 'Дата выезда должна быть позже даты заезда'}
                )

        # проверка пересечения дат
        listing = attrs.get('listing')
        if listing and check_in and check_out:
            overlap = Booking.objects.filter(
                listing=listing,
                status__in=[
                    Booking.Status.PENDING,
                    Booking.Status.CONFIRMED
                ],
                check_in__lt=check_out,
                check_out__gt=check_in,
            )
            # при обновлении исключаем текущий объект
            if self.instance:
                overlap = overlap.exclude(pk=self.instance.pk)
            if overlap.exists():
                raise serializers.ValidationError(
                    {'check_in': 'Эти даты уже заняты'}
                )
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    author_email = serializers.SerializerMethodField()
    author_name  = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id', 'listing', 'booking',
            'author', 'author_email', 'author_name',
            'rating', 'comment', 'created_at'
        ]
        read_only_fields = [
            'id', 'author', 'created_at'
        ]

    def get_author_email(self, obj):
        return obj.author.email

    def get_author_name(self, obj):
        return f'{obj.author.first_name} {obj.author.last_name}'

    def validate(self, attrs):
        booking = attrs.get('booking')
        request = self.context.get('request')

        # отзыв только на своё бронирование
        if booking.tenant != request.user:
            raise serializers.ValidationError(
                'Можно оставить отзыв только на своё бронирование'
            )

        # бронирование должно быть завершено
        if booking.status != Booking.Status.COMPLETED:
            raise serializers.ValidationError(
                'Можно оставить отзыв только после завершения бронирования'
            )

        # один отзыв на одно бронирование
        if Review.objects.filter(booking=booking).exists():
            raise serializers.ValidationError(
                'Отзыв на это бронирование уже существует'
            )

        # listing должен совпадать с listing из booking
        attrs['listing'] = booking.listing
        return attrs