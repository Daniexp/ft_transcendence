FROM debian:bullseye

RUN apt-get update && apt-get install nginx -y && apt-get install openssl -y




COPY ./entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
COPY ./nginx.conf /etc/nginx/conf.d/default.conf


EXPOSE 443

ENTRYPOINT ["/usr/bin/entrypoint.sh"]