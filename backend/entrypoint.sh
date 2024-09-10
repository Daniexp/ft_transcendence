set -e

mkdir -p /etc/ssl/certs

python3 manage.py makemigrations
python3 manage.py migrate
#if [ -z "$( ls -A '/project/staticfiles/js' )" ]; then
 #   python3 manage.py collectstatic
#fi


#nohup python3 manage.py runserver 0.0.0.0:8080 &

#rm -rf nohup.out

#daphne -p 5000 -b 0.0.0.0 project.asgi:application

exec tail -f