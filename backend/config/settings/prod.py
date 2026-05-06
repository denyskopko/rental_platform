from .base import *
from .base import env

DEBUG = False

# S3 только если ключи заполнены
if env('AWS_ACCESS_KEY_ID', default=''):
    AWS_ACCESS_KEY_ID       = env('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY   = env('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = env('AWS_S3_BUCKET')
    AWS_S3_REGION_NAME      = env('AWS_S3_REGION', default='eu-central-1')
    AWS_S3_FILE_OVERWRITE   = False
    AWS_DEFAULT_ACL         = 'public-read'
    AWS_S3_CUSTOM_DOMAIN    = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    DEFAULT_FILE_STORAGE    = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL               = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
else:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    MEDIA_URL  = '/media/'
    MEDIA_ROOT = BASE_DIR / 'media'

SECURE_BROWSER_XSS_FILTER   = True
SECURE_CONTENT_TYPE_NOSNIFF = True