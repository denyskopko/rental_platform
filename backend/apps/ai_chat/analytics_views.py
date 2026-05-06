from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import F
from .models import SearchHistory, ViewHistory
from apps.listings.models import Listing
from apps.listings.serializers import ListingShortSerializer


class SearchHistoryView(APIView):
    """История поиска пользователя"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = SearchHistory.objects.filter(
            user=request.user
        ).order_by('-search_count')[:20]

        data = [
            {
                'keyword': h.keyword,
                'search_count': h.search_count,
                'last_searched_at': h.last_searched_at,
            }
            for h in history
        ]
        return Response(data)

    def delete(self, request):
        """Очистить историю поиска"""
        SearchHistory.objects.filter(user=request.user).delete()
        return Response({'message': 'История поиска очищена'})


class PopularSearchesView(APIView):
    """Популярные поисковые запросы всех пользователей"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        popular = SearchHistory.objects.values('keyword').order_by(
            '-search_count'
        )[:10]

        # суммируем по всем пользователям
        from django.db.models import Sum
        popular = SearchHistory.objects.values('keyword').annotate(
            total=Sum('search_count')
        ).order_by('-total')[:10]

        data = [
            {
                'keyword': p['keyword'],
                'total_searches': p['total'],
            }
            for p in popular
        ]
        return Response(data)


class ViewHistoryView(APIView):
    """История просмотров пользователя"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # последние 20 просмотренных объявлений без повторов
        viewed_ids = ViewHistory.objects.filter(
            user=request.user
        ).order_by('-viewed_at').values_list(
            'listing_id', flat=True
        ).distinct()[:20]

        # сохраняем порядок
        listings = Listing.objects.filter(
            id__in=viewed_ids
        ).prefetch_related('images')

        # сортируем по порядку просмотров
        listings = sorted(
            listings,
            key=lambda x: list(viewed_ids).index(x.id)
        )

        serializer = ListingShortSerializer(
            listings, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def delete(self, request):
        """Очистить историю просмотров"""
        ViewHistory.objects.filter(user=request.user).delete()
        return Response({'message': 'История просмотров очищена'})


class PopularListingsView(APIView):
    """Популярные объявления по количеству просмотров"""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        listings = Listing.objects.filter(
            is_active=True
        ).order_by('-view_count')[:10].prefetch_related('images')

        serializer = ListingShortSerializer(
            listings, many=True, context={'request': request}
        )
        return Response(serializer.data)