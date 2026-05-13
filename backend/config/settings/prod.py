from .base import *
from .base import env

DEBUG = False

# S3 только если ключи заполнены
if env('AWS_ACCESS_KEY_ID', default=''):
    AWS_ACCESS_KEY_ID        = env('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY    = env('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME  = env('AWS_S3_BUCKET')
    AWS_S3_REGION_NAME       = env('AWS_S3_REGION', default='eu-central-1')
    AWS_S3_FILE_OVERWRITE    = False
    AWS_DEFAULT_ACL          = 'public-read'
    AWS_QUERYSTRING_AUTH     = False
    AWS_S3_OBJECT_PARAMETERS = {'CacheControl': 'max-age=86400'}
    AWS_S3_CUSTOM_DOMAIN     = f'{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com'
    MEDIA_URL                = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3boto3.S3Boto3Storage',
            'OPTIONS': {
                'location': 'media',
                'default_acl': 'public-read',
                'querystring_auth': False,
            }
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        }
    }
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'ERROR',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': True,
        },
    },
}
