from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import F
from django.core.cache import cache
from django.conf import settings
import hashlib
from datetime import date
from .models import Listing, ListingImage
from .serializers import ListingSerializer, ListingShortSerializer
from .filters import ListingFilter
from apps.users.permissions import IsLandlord, IsOwnerOrReadOnly
from apps.ai_chat.models import ViewHistory, SearchHistory
from django.core.exceptions import PermissionDenied
from django.db import IntegrityError, DatabaseError
from rest_framework.exceptions import ValidationError




def get_viewer_key(request, listing_id):
    if request.user.is_authenticated:
        identifier = f"user_{request.user.id}"
    else:
        ip = request.META.get(
            'HTTP_X_FORWARDED_FOR',
            request.META.get('REMOTE_ADDR', 'unknown')
        )
        ua = request.META.get('HTTP_USER_AGENT', '')
        raw = f"{ip}:{ua}"
        identifier = hashlib.md5(raw.encode()).hexdigest()
    month = date.today().strftime('%Y-%m')
    return f"view:{listing_id}:{identifier}:{month}"


def clear_listing_cache(instance=None):
    from django.conf import settings
    try:
        if settings.DEBUG:
            cache.clear()
        else:
            if instance:
                cache.delete(f"listings:detail:{instance.pk}")
                cache.delete(f"listings:detail:data:{instance.pk}")
            cache.delete_pattern("listings:list:*")
    except AttributeError:
        # Redis недоступен — используем clear()
        cache.clear()


class ListingViewSet(viewsets.ModelViewSet):
    queryset         = Listing.objects.prefetch_related('images').select_related('owner')
    filter_backends  = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class  = ListingFilter
    search_fields    = ['title', 'description', 'city', 'district']
    ordering_fields  = ['price_per_night', 'created_at', 'view_count', 'avg_rating', 'rooms']
    ordering         = ['-created_at']

    def get_queryset(self):
        qs = Listing.objects.prefetch_related('images').select_related('owner')

        if self.action in ['retrieve', 'update', 'partial_update',
                           'destroy', 'toggle_active']:
            return qs

        if self.action == 'my':
            if self.request.user.is_authenticated and self.request.user.is_landlord():
                return qs.filter(owner=self.request.user)

        return qs.filter(is_active=True)

    def get_serializer_class(self):
        if self.action == 'list':
            return ListingShortSerializer
        return ListingSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [IsLandlord()]
        if self.action in ['update', 'partial_update', 'destroy', 'toggle_active']:
            return [IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def list(self, request, *args, **kwargs):
        try:
            keyword = request.query_params.get('search', '').strip()
            if keyword and request.user.is_authenticated:
                obj, created = SearchHistory.objects.get_or_create(
                    user=request.user,
                    keyword=keyword,
                )
                if not created:
                    SearchHistory.objects.filter(pk=obj.pk).update(
                        search_count=F('search_count') + 1
                    )

            cache_key = f"listings:list:{request.query_params.urlencode()}"
            cached = cache.get(cache_key)
            if cached and not request.user.is_authenticated:
                return Response(cached, status=status.HTTP_200_OK)

            response = super().list(request, *args, **kwargs)

            if not request.user.is_authenticated:
                cache.set(cache_key, response.data, timeout=300)

            return response

        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()

            # антинакрутка просмотров
            viewer_key = get_viewer_key(request, instance.pk)
            already_viewed = cache.get(viewer_key)

            if not already_viewed:
                Listing.objects.filter(pk=instance.pk).update(
                    view_count=F('view_count') + 1
                )
                cache.set(viewer_key, True, timeout=60 * 60 * 24 * 31)
                if request.user.is_authenticated:
                    ViewHistory.objects.create(
                        listing=instance,
                        user=request.user
                    )

            # кэш данных объявления
            data_key = f"listings:detail:data:{instance.pk}"
            cached_data = cache.get(data_key)
            if cached_data:
                return Response(cached_data, status=status.HTTP_200_OK)

            instance.refresh_from_db()
            serializer = self.get_serializer(instance)
            cache.set(data_key, serializer.data, timeout=300)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Listing.DoesNotExist:
            return Response(
                {'error': 'Объявление не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        try:
            print('FILES:', list(request.FILES.keys()))
            print('COUNT:', len(request.FILES.getlist('uploaded_images')))
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_create(serializer)
            clear_listing_cache()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response(
                {'errors': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'error': 'Объявление с такими данными уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(
                instance, data=request.data, partial=partial
            )
            if not serializer.is_valid():
                return Response(
                    {'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_update(serializer)
            clear_listing_cache(instance)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Listing.DoesNotExist:
            return Response(
                {'error': 'Объявление не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied:
            return Response(
                {'error': 'Нет прав для редактирования'},
                status=status.HTTP_403_FORBIDDEN
            )
        except ValidationError as e:
            return Response(
                {'errors': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        except Exception:
            return Response(
                {'error': 'Ошибка обновления объявления'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            clear_listing_cache(instance)
            instance.delete()
            return Response(
                {'message': 'Объявление удалено'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Listing.DoesNotExist:
            return Response(
                {'error': 'Объявление не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied:
            return Response(
                {'error': 'Нет прав для удаления'},
                status=status.HTTP_403_FORBIDDEN
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        try:
            listing = self.get_object()
            listing.is_active = not listing.is_active
            listing.save()
            clear_listing_cache(listing)
            return Response(
                {
                    'id': listing.id,
                    'is_active': listing.is_active,
                    'message': 'Активно' if listing.is_active else 'Скрыто'
                },
                status=status.HTTP_200_OK
            )
        except Listing.DoesNotExist:
            return Response(
                {'error': 'Объявление не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied:
            return Response(
                {'error': 'Нет прав для изменения статуса'},
                status=status.HTTP_403_FORBIDDEN
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    @action(detail=False, methods=['get'], permission_classes=[IsLandlord])
    def my(self, request):
        try:
            qs = Listing.objects.filter(
                owner=request.user
            ).prefetch_related('images')
            serializer = ListingShortSerializer(
                qs, many=True, context={'request': request}
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DatabaseError:
            return Response(
                {'error': 'Ошибка получения объявлений'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )