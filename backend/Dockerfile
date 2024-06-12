FROM python:3.9-slim

WORKDIR /

COPY requirements.txt /

COPY ./django/ /project/

COPY ./entrypoint.sh /entrypoint.sh

RUN pip install --no-cache-dir -r /requirements.txt

COPY . /home

ENTRYPOINT ["bash","entrypoint.sh"]

