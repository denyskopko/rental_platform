from rest_framework import serializers
from .models import AIChatSession


class MessageSerializer(serializers.Serializer):
    session_id = serializers.IntegerField(required=False)
    message    = serializers.CharField()


class AIChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AIChatSession
        fields = [
            'id', 'messages', 'extracted_params', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']