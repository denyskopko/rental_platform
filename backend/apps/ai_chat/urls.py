from django.urls import path
from .views import ChatView, ExtractParamsView, ChatHistoryView, ChatSearchView
from .analytics_views import (
    SearchHistoryView,
    PopularSearchesView,
    ViewHistoryView,
    PopularListingsView,
)


urlpatterns = [
    #чат
    path('message/', ChatView.as_view(),        name='chat_message'),
    path('extract/', ExtractParamsView.as_view(), name='chat_extract'),
    path('history/', ChatHistoryView.as_view(),  name='chat_history'),
    path('search/',  ChatSearchView.as_view(),   name='chat_search'),

    #аналитика
path('analytics/search-history/',  SearchHistoryView.as_view(),   name='search_history'),
    path('analytics/popular-searches/', PopularSearchesView.as_view(), name='popular_searches'),
    path('analytics/view-history/',    ViewHistoryView.as_view(),     name='view_history'),
    path('analytics/popular-listings/', PopularListingsView.as_view(), name='popular_listings'),
]