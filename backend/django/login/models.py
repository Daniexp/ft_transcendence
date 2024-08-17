from django.db import models

class User(models.Model):
    login = models.CharField(max_length=255)
    online = models.BooleanField(default=True)
    uid = models.IntegerField()

    def __str__(self):
        return f"User(login={self.login}, online={self.online}, uid={self.uid})"
    def create_or_update_user(cls, uid, login, online):
        # Comprobar si el usuario ya existe
        user, created = cls.objects.get_or_create(uid=uid, defaults={'login': login, 'online': online})
        
        if not created:
            # El usuario ya existe, actualizar el campo `online`
            user.login = login
            user.online = online
            user.save()
        
        return user, created
    class Meta:
        db_table = 'user_data'  # Nombre de la tabla en la base de datos