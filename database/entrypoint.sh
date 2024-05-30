#!/bin/bash
set -e

echo "host all all 172.18.0.0/24 md5" >> /etc/postgresql/15/main/pg_hba.conf

echo "CREATE DATABASE $POSTGRES_DB;" > /psql.init

echo  "ALTER USER postgres WITH ENCRYPTED PASSWORD '"$DB_PSSWRD"';" >> /psql.init

service postgresql start

su postgres -c "psql < /psql.init"

service postgresql stop

rm -rf /psql.init

exec pg_ctlcluster 15 main start --foreground