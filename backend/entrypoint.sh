#!/bin/bash
set -e

# Fix settings file
fix_settings_file() {
    SETTINGS_FILE="/app/transendence/settings.py"
    if ! grep -q "import os" "$SETTINGS_FILE"; then
        sed -i '1i import os' "$SETTINGS_FILE"
    fi
}

# Perform initialization if manage.py does not exist
if [ ! -f "/app/manage.py" ]; then
    django-admin startproject transendence /app
    sed -i "s/'ENGINE': 'django.db.backends.sqlite3'/'ENGINE': 'django.db.backends.postgresql'/g" /app/transendence/settings.py
    sed -i "s/'NAME': BASE_DIR \/ 'db.sqlite3'/'NAME': 'transendence'/g" /app/transendence/settings.py
    sed -i "/'NAME': 'transendence'/a\        'USER': 'user',\n        'PASSWORD': 'password',\n        'HOST': 'db',\n        'PORT': '5432'," /app/transendence/settings.py
    echo "ALLOWED_HOSTS = ['*']" >> /app/transendence/settings.py
    echo "STATIC_ROOT = os.path.join(BASE_DIR, 'static')" >> /app/transendence/settings.py
    fix_settings_file
    python manage.py migrate
    python manage.py collectstatic --noinput
else
    fix_settings_file
fi

exec "$@"

