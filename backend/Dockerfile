FROM python:3.9-slim


COPY requirements.txt /

COPY ./django/ /project/

RUN pip install --no-cache-dir -r /requirements.txt

COPY . /home

WORKDIR /project

COPY ./entrypoint.sh /entrypoint.sh

ENTRYPOINT [ "bash", "/entrypoint.sh" ]
