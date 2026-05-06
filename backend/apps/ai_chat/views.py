from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import AIChatSession
from .serializers import MessageSerializer, AIChatSessionSerializer
from .gemini import chat_response, extract_search_params
from apps.listings.models import Listing
from apps.listings.serializers import ListingShortSerializer
from django.db import DatabaseError

try:
    from google.genai.errors import ServerError
except ImportError:
    ServerError = Exception


class ChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = MessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        session_id   = serializer.validated_data.get('session_id')
        user_message = serializer.validated_data['message']

        try:
            if session_id:
                try:
                    session = AIChatSession.objects.get(
                        id=session_id,
                        user=request.user
                    )
                except AIChatSession.DoesNotExist:
                    return Response(
                        {'error': 'Сессия не найдена'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                session = AIChatSession.objects.create(
                    user=request.user,
                    messages=[]
                )

            session.messages.append({
                'role': 'user',
                'content': user_message
            })

            try:
                reply = chat_response(session.messages)
            except ServerError:
                session.messages.pop()
                session.save()
                return Response(
                    {'error': 'Gemini перегружен, попробуй через несколько секунд'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            except ConnectionError:
                session.messages.pop()
                session.save()
                return Response(
                    {'error': 'Нет соединения с Gemini'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )

            session.messages.append({
                'role': 'model',
                'content': reply
            })
            session.save()

            return Response({
                'session_id': session.id,
                'reply': reply,
                'messages_count': len(session.messages)
            }, status=status.HTTP_200_OK)

        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ExtractParamsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session_id = request.data.get('session_id')

        if not session_id:
            return Response(
                {'error': 'session_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = AIChatSession.objects.get(
                id=session_id,
                user=request.user
            )
        except AIChatSession.DoesNotExist:
            return Response(
                {'error': 'Сессия не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not session.messages:
            return Response(
                {'error': 'Диалог пустой'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            params = extract_search_params(session.messages)
            session.extracted_params = params
            session.save()
            return Response({
                'session_id': session.id,
                'extracted_params': params
            }, status=status.HTTP_200_OK)

        except ServerError:
            return Response(
                {'error': 'Gemini перегружен, попробуй позже'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except ConnectionError:
            return Response(
                {'error': 'Нет соединения с Gemini'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except ValueError as e:
            return Response(
                {'error': f'Ошибка парсинга ответа: {str(e)}'},
                status=status.HTTP_422_UNPROCESSABLE_ENTITY
            )
        except DatabaseError:
            return Response(
                {'error': 'Ошибка базы данных'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    CITY_TRANSLATIONS = {
        'берлин': 'Berlin',
        'мюнхен': 'Munich',
        'гамбург': 'Hamburg',
        'франкфурт': 'Frankfurt',
        'кёльн': 'Cologne',
        'кельн': 'Cologne',
        'штутгарт': 'Stuttgart',
        'дюссельдорф': 'Dusseldorf',
        'дрезден': 'Dresden',
        'лейпциг': 'Leipzig',
    }

    DISTRICT_TRANSLATIONS = {
        'митте': 'Mitte',
        'пренцлауэр берг': 'Prenzlauer Berg',
        'кройцберг': 'Kreuzberg',
        'шарлоттенбург': 'Charlottenburg',
        'фридрихсхайн': 'Friedrichshain',
    }

    def post(self, request):
        session_id = request.data.get('session_id')

        if not session_id:
            return Response(
                {'error': 'session_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            session = AIChatSession.objects.get(
                id=session_id,
                user=request.user
            )
        except AIChatSession.DoesNotExist:
            return Response(
                {'error': 'Сессия не найдена'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not session.extracted_params:
            return Response(
                {'error': 'Сначала вызови /extract/'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            params = session.extracted_params
            qs = Listing.objects.filter(
                is_active=True
            ).prefetch_related('images')

            if params.get('city'):
                city = params['city']
                city_en = self.CITY_TRANSLATIONS.get(city.lower(), city)
                qs = qs.filter(city__icontains=city_en)

            if params.get('district'):
                district = params['district']
                district_en = self.DISTRICT_TRANSLATIONS.get(
                    district.lower(), district
                )
                qs = qs.filter(district__icontains=district_en)

            if params.get('property_type'):
                qs = qs.filter(property_type=params['property_type'])

            if params.get('price_min'):
                qs = qs.filter(price_per_night__gte=params['price_min'])

            if params.get('price_max'):
                qs = qs.filter(price_per_night__lte=params['price_max'])

            if params.get('rooms_min'):
                qs = qs.filter(rooms__gte=params['rooms_min'])

            if params.get('rooms_max'):
                qs = qs.filter(rooms__lte=params['rooms_max'])

            if params.get('check_in') and params.get('check_out'):
                from apps.bookings.models import Booking
                busy = Booking.objects.filter(
                    status__in=[
                        Booking.Status.PENDING,
                        Booking.Status.CONFIRMED,
                    ],
                    check_in__lt=params['check_out'],
                    check_out__gt=params['check_in'],
                ).values_list('listing_id', flat=True)
                qs = qs.exclude(id__in=busy)

            serializer = ListingShortSerializer(
                qs, many=True, context={'request': request}
            )
            return Response({
                'params_used': params,
                'count': qs.count(),
                'results': serializer.data
            }, status=status.HTTP_200_OK)

        except Exception:
            return Response(
                {'error': 'Ошибка поиска'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            sessions = AIChatSession.objects.filter(
                user=request.user
            ).order_by('-created_at')[:10]
            serializer = AIChatSessionSerializer(sessions, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response(
                {'error': 'Ошибка получения истории'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )