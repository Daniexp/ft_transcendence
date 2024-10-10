set -e

OVERWRITE_STATICFILES="yes"

mkdir -p /etc/ssl/certs

python3 manage.py makemigrations
python3 manage.py migrate

echo $OVERWRITE_STATICFILES | python3 manage.py collectstatic

daphne -p 5000 -b 0.0.0.0 project.asgi:application
