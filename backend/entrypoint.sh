set -e

python3 manage.py migrate

nohup python3 manage.py runserver 0.0.0.0:8080 &

rm -rf nohup.out

daphne -p 8000 project.asgi:application