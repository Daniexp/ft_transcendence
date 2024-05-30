FROM debian:bookworm

RUN apt update && apt install postgresql -y && apt install postgresql-contrib -y && apt install vim -y

WORKDIR /

COPY entrypoint.sh /entrypoint.sh

COPY ./conf/postgresql.conf /etc/postgresql/15/main/postgresql.conf

RUN chown postgres:postgres /etc/postgresql/15/main/postgresql.conf

ENTRYPOINT ["bash", "entrypoint.sh"] 

