#!/bin/bash
set -e

# Fix settings file
fix_settings_file() {
    SETTINGS_FILE="/app/Transcendence/settings.py"
    if ! grep -q "import os" "$SETTINGS_FILE"; then
        sed -i '1i import os' "$SETTINGS_FILE"
    fi
}

## Perform initialization if manage.py does not exist
#if [ ! -f "/project/manage.py " ]; then
 #   django-admin startproject project /project
    #python3 /project/manage.py migrate
  #  cd /project
   # python3 manage.py startapp app
#    sed -i "s/'ENGINE': 'django.db.backends.sqlite3'/'ENGINE': 'django.db.backends.postgresql'/g" /app/Transcendence/settings.py
#    sed -i "s/'NAME': BASE_DIR \/ 'db.sqlite3'/'NAME': 'Transcendence'/g" /app/Transcendence/settings.py
#    sed -i "/'NAME': 'Transcendence'/a\        'USER': 'user',\n        'PASSWORD': 'password',\n        'HOST': 'db',\n        'PORT': '5432'," /app/Transcendence/settings.py
#    echo "ALLOWED_HOSTS = ['*']" >> /app/Transcendence/settings.py
#    echo "STATIC_ROOT = os.path.join(BASE_DIR, 'static')" >> /app/Transcendence/settings.py
#    fix_settings_file
#    python manage.py migrate
#    python manage.py collectstatic --noinput
#else
#    fix_settings_file
#fi

#exec "$@"
exec tail -f

