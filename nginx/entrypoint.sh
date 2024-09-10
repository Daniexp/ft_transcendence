#!/bin/bash
set -e


if [ ! -f $SSLPATH/Server.crt ]; then

    mkdir -p /etc/nginx/ssl

    chmod 700 /etc/nginx/ssl

    openssl req -newkey rsa:2048 -nodes -keyout $KEY -out $CSR -subj "/C=/ST=/L=/O=/OU=/CN=$DOMAIN_NAME/emailAdress="

    openssl x509 -req -in $CSR -signkey $KEY -out $SSLPATH/Server.crt
fi

exec nginx -g "daemon off;"
#exec tail -f