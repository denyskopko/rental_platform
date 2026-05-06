from rest_framework.permissions import BasePermission


class IsLandlord(BasePermission):
    message = 'Доступно только арендодателям'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.is_landlord()
        )


class IsTenant(BasePermission):
    message = 'Доступно только арендаторам'

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.is_tenant()
        )


class IsOwnerOrReadOnly(BasePermission):
    message = 'Редактировать может только владелец'

    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return obj.owner == request.user