from rest_framework import serializers
from .models import Listing, ListingImage


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ListingImage
        fields = ['id', 'image', 'order']


class ListingSerializer(serializers.ModelSerializer):
    images          = ListingImageSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )
    owner_email = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'owner', 'owner_email', 'title', 'description',
            'city', 'district', 'property_type', 'price_per_night',
            'rooms', 'is_active', 'view_count', 'avg_rating',
            'images', 'uploaded_images', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'owner', 'view_count', 'avg_rating',
            'created_at', 'updated_at'
        ]

    def get_owner_email(self, obj):
        return obj.owner.email

    def create(self, validated_data):
        images = validated_data.pop('uploaded_images', [])
        listing = Listing.objects.create(**validated_data)
        for i, img in enumerate(images):
            ListingImage.objects.create(
                listing=listing,
                image=img,
                order=i
            )
        return listing

    def update(self, instance, validated_data):
        validated_data.pop('uploaded_images', None)
        return super().update(instance, validated_data)


class ListingShortSerializer(serializers.ModelSerializer):
    """Краткий сериализатор для списка объявлений"""
    main_image = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'title', 'city', 'district',
            'property_type', 'price_per_night',
            'rooms', 'avg_rating', 'view_count', 'main_image'
        ]

    def get_main_image(self, obj):
        first = obj.images.first()
        if first:
            request = self.context.get('request')
            return request.build_absolute_uri(first.image.url) if request else first.image.url
        return None