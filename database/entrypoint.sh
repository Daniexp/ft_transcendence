#!/bin/bash
set -e

echo "host  all all 172.18.0.0/24   trust" >> /etc/postgresql/15/main/pg_hba.conf

echo "CREATE DATABASE $POSTGRES_DB" > /psql.init

service postgresql start

su postgres -c "psql < /psql.init"

service postgresql stop


exec pg_ctlcluster 15 main start --foreground