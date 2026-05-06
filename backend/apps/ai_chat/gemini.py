import json
import re
from google import genai
from google.genai import types
from django.conf import settings


MODEL = 'gemini-2.5-flash-lite'

SYSTEM_PROMPT = """Ты помощник по поиску жилья в Германии.
Твоя задача — помочь пользователю найти подходящее жильё.
Задавай уточняющие вопросы о:
- городе или районе
- датах заезда и выезда
- бюджете (цена за ночь)
- количестве комнат
- типе жилья (квартира, дом, студия, комната)

Отвечай кратко и дружелюбно. Язык общения — русский.
Не используй markdown форматирование: никаких **, *, #, списков с тире.
Пиши простым текстом."""

EXTRACT_PROMPT = """На основе диалога извлеки параметры поиска жилья.
Верни ТОЛЬКО валидный JSON без пояснений и без markdown.

ВАЖНО:
- city и district всегда на английском языке (Berlin, Munich, Mitte, Hamburg и т.д.)
- check_in и check_out в формате YYYY-MM-DD, текущий год 2026
- property_type только одно из: apartment, house, studio, room

{{
  "city": "название города на английском или null",
  "district": "район на английском или null",
  "check_in": "YYYY-MM-DD или null",
  "check_out": "YYYY-MM-DD или null",
  "price_min": число или null,
  "price_max": число или null,
  "rooms_min": число или null,
  "rooms_max": число или null,
  "property_type": "apartment/house/studio/room или null"
}}

Диалог:
{conversation}"""


def get_client():
    """Создаём клиент только при вызове — не при импорте"""
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def clean_reply(text: str) -> str:
    """Убирает markdown форматирование из ответа Gemini"""
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'^\s*[\*\-]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{2,}', '\n', text)
    text = text.strip()
    return text


def chat_response(messages: list) -> str:
    """Отправляет сообщение и получает ответ от Gemini"""
    client = get_client()

    history = []
    for msg in messages[:-1]:
        history.append(
            types.Content(
                role='user' if msg['role'] == 'user' else 'model',
                parts=[types.Part(text=msg['content'])]
            )
        )

    chat = client.chats.create(
        model=MODEL,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        ),
        history=history,
    )

    response = chat.send_message(messages[-1]['content'])
    return clean_reply(response.text)


def extract_search_params(messages: list) -> dict:
    """Извлекает параметры поиска из диалога"""
    client = get_client()

    conversation = '\n'.join([
        f"{m['role']}: {m['content']}"
        for m in messages
    ])

    response = client.models.generate_content(
        model=MODEL,
        contents=EXTRACT_PROMPT.format(conversation=conversation),
    )

    text = response.text.strip()
    text = text.replace('```json', '').replace('```', '').strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            'city': None, 'district': None,
            'check_in': None, 'check_out': None,
            'price_min': None, 'price_max': None,
            'rooms_min': None, 'rooms_max': None,
            'property_type': None
        }