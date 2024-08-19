from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class UserRegister(AbstractBaseUser, PermissionsMixin):
    login = models.CharField(max_length=255, unique=True)
    password = models.CharField(max_length=255, default="")
    uid = models.IntegerField()
    api_data = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True) 
    
    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = []

    objects = BaseUserManager()

    def __str__(self):
        return f"User(login={self.login}, online={self.online}, uid={self.uid})"
    def set_password(self, raw_password):
        from django.contrib.auth.hashers import make_password
        self.password = make_password(raw_password)
        self.save()
