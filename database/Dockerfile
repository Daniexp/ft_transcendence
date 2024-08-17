FROM debian:bookworm

ARG POSTGRES_DB \
    DB_PSSWRD

RUN apt update && apt install postgresql -y && apt install postgresql-contrib -y && apt install vim -y

WORKDIR /

COPY entrypoint.sh /entrypoint.sh

COPY ./conf/postgresql.conf /etc/postgresql/15/main/postgresql.conf

RUN chown postgres:postgres /etc/postgresql/15/main/postgresql.conf

#RUN echo "host all all 172.18.0.0/24 trust" >> /etc/postgresql/15/main/pg_hba.conf

RUN echo "CREATE DATABASE ${POSTGRES_DB};" > /psql.init && \
    echo "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO postgres;" >> /psql.init && \
    echo "ALTER USER postgres WITH ENCRYPTED PASSWORD '${DB_PSSWRD}';" >> /psql.init
    #echo '\\c "'${POSTGRES_DB}'"' >> /psql.init && \
    #echo "CREATE TABLE user_data ( id INTEGER, login VARCHAR(255), online BOOLEAN);" >> /psql.init


RUN echo "host all all 172.18.0.0/24 md5" >> /etc/postgresql/15/main/pg_hba.conf

RUN chown postgres:postgres /psql.init
RUN service postgresql start && su postgres -c "psql < /psql.init" && service postgresql stop
#RUN service postgresql start && "psql < /psql.init" && service postgresql stop

#RUN rm -rf /psql.init

USER postgres
ENTRYPOINT ["pg_ctlcluster", "15", "main", "start", "--foreground"]

