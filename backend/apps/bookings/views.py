from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg
from datetime import date
from .models import Booking, Review
from .serializers import BookingSerializer, ReviewSerializer
from apps.users.permissions import IsTenant, IsLandlord
from django.core.exceptions import PermissionDenied
from django.db import IntegrityError, DatabaseError
from rest_framework.exceptions import ValidationError

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names  = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        qs   = Booking.objects.select_related(
            'listing', 'tenant', 'listing__owner'
        ).prefetch_related('listing__images')

        # автоматически завершаем просроченные брони
        today = date.today()
        Booking.objects.filter(
            status=Booking.Status.CONFIRMED,
            check_out__lt=today
        ).update(status=Booking.Status.COMPLETED)

        if user.is_landlord():
            return qs.filter(listing__owner=user)
        return qs.filter(tenant=user)

    def get_permissions(self):
        if self.action == 'create':
            return [IsTenant()]
        if self.action in ['confirm', 'reject']:
            return [IsLandlord()]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response(
                {'errors': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'error': 'Бронирование уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        try:
            booking = self.get_object()

            if booking.listing.owner != request.user:
                return Response(
                    {'error': 'Нет прав для подтверждения'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if booking.status != Booking.Status.PENDING:
                return Response(
                    {'error': 'Можно подтвердить только ожидающее бронирование'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            booking.status = Booking.Status.CONFIRMED
            booking.save()
            return Response(
                BookingSerializer(booking, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Бронирование не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied:
            return Response(
                {'error': 'Нет прав'},
                status=status.HTTP_403_FORBIDDEN
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            booking = self.get_object()

            if booking.listing.owner != request.user:
                return Response(
                    {'error': 'Нет прав для отклонения'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if booking.status != Booking.Status.PENDING:
                return Response(
                    {'error': 'Можно отклонить только ожидающее бронирование'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            booking.status = Booking.Status.CANCELLED
            booking.save()
            return Response(
                BookingSerializer(booking, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Бронирование не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied:
            return Response(
                {'error': 'Нет прав'},
                status=status.HTTP_403_FORBIDDEN
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        try:
            booking = self.get_object()

            if booking.listing.owner != request.user:
                return Response(
                    {'error': 'Нет прав для отклонения'},
                    status=status.HTTP_403_FORBIDDEN
                )
            if booking.status != Booking.Status.PENDING:
                return Response(
                    {'error': 'Можно отклонить только ожидающее бронирование'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            booking.status = Booking.Status.CANCELLED
            booking.save()
            return Response(
                BookingSerializer(booking, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Бронирование не найдено'},
                status=status.HTTP_404_NOT_FOUND
            )
        except PermissionDenied:
            return Response(
                {'error': 'Нет прав'},
                status=status.HTTP_403_FORBIDDEN
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class  = ReviewSerializer
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        try:
            qs = Review.objects.select_related(
                'author', 'listing', 'booking'
            )
            listing_id = self.request.query_params.get('listing')
            if listing_id:
                qs = qs.filter(listing_id=listing_id)

            # фильтр по автору
            author = self.request.query_params.get('author')
            if author == 'me' and self.request.user.is_authenticated:
                qs = qs.filter(author=self.request.user)

            return qs
        except DatabaseError:
            return Review.objects.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsTenant()]
        if self.action == 'destroy':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            if not serializer.is_valid():
                return Response(
                    {'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            review = serializer.save(author=request.user)

            # пересчитываем avg_rating
            avg = Review.objects.filter(
                listing=review.listing
            ).aggregate(Avg('rating'))['rating__avg']
            review.listing.avg_rating = round(avg, 2)
            review.listing.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response(
                {'errors': e.detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            return Response(
                {'error': 'Отзыв на это бронирование уже существует'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            if instance.author != request.user:
                return Response(
                    {'error': 'Нет прав для удаления'},
                    status=status.HTTP_403_FORBIDDEN
                )
            instance.delete()
            return Response(
                {'message': 'Отзыв удалён'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Review.DoesNotExist:
            return Response(
                {'error': 'Отзыв не найден'},
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
