from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email обязателен')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.LANDLORD)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        TENANT   = 'tenant',   'Арендатор'
        LANDLORD = 'landlord', 'Арендодатель'

    username   = None
    email      = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    last_name  = models.CharField(max_length=50)
    role       = models.CharField(
        max_length=10,
        choices=Role.choices,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    objects = UserManager()

    def is_landlord(self):
        return self.role == self.Role.LANDLORD

    def is_tenant(self):
        return self.role == self.Role.TENANT

    def __str__(self):
        return self.email

    class Meta:
        db_table   = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'