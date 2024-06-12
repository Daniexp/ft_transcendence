set -e

# fix_settings_file() {
#     SETTINGS_FILE="/home/Transcendence/settings.py"
#     if ! grep -q "import os" "$SETTINGS_FILE"; then
#         sed -i '1i import os' "$SETTINGS_FILE"
#     fi
# }

## Perform initialization if manage.py does not exist
#if [ ! -f "/project/manage.py " ]; then
 #   django-admin startproject project /project
    #python3 /project/manage.py migrate
  #  cd /project
   # python3 manage.py startapp home
#    sed -i "s/'ENGINE': 'django.db.backends.sqlite3'/'ENGINE': 'django.db.backends.postgresql'/g" /home/Transcendence/settings.py
#    sed -i "s/'NAME': BASE_DIR \/ 'db.sqlite3'/'NAME': 'Transcendence'/g" /home/Transcendence/settings.py
#    sed -i "/'NAME': 'Transcendence'/a\        'USER': 'user',\n        'PASSWORD': 'password',\n        'HOST': 'db',\n        'PORT': '5432'," /home/Transcendence/settings.py
#    echo "ALLOWED_HOSTS = ['*']" >> /home/Transcendence/settings.py
#    echo "STATIC_ROOT = os.path.join(BASE_DIR, 'static')" >> /home/Transcendence/settings.py
#    fix_settings_file
#    python manage.py migrate
#    python manage.py collectstatic --noinput
#else
#    fix_settings_file
#fi

#exec "$@"
exec tail -f

