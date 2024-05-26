#!/bin/bash
set -e

if [ ! -f "/app/manage.py" ]; then
    django-admin startproject transendence /app
    # Update settings.py to configure the database
    sed -i "s/'ENGINE': 'django.db.backends.sqlite3'/'ENGINE': 'django.db.backends.postgresql'/g" /app/transendence/settings.py
    sed -i "s/'NAME': BASE_DIR \/ 'db.sqlite3'/'NAME': 'transendence'/g" /app/transendence/settings.py
    sed -i "/'NAME': 'transendence'/a\        'USER': 'user',\n        'PASSWORD': 'password',\n        'HOST': 'db',\n        'PORT': '5432'," /app/transendence/settings.py
    echo "ALLOWED_HOSTS = ['*']" >> /app/transendence/settings.py
    echo "STATIC_ROOT = os.path.join(BASE_DIR, 'static')" >> /app/transendence/settings.py
    python manage.py migrate
    python manage.py collectstatic --noinput
fi

exec "$@"

