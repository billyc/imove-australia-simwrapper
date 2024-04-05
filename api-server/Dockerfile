FROM nginx:alpine

# python ----------------------------------------------------------
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache bash python3 py3-pip && ln -sf python3 /usr/bin/python
RUN pip3 install --no-cache --upgrade pip setuptools

# Flask/Gunicorn --------------------------------------------------
RUN pip3 install --no-cache gunicorn flask flask-restful flask-cors

# Magic Wormhole for file transfers
RUN pip3 install --no-cache magic-wormhole

# Apache Spark
RUN pip3 install --no-cache pandas pyspark
RUN apk add --update --no-cache openjdk17
# snappy compression library was causing problems, found this --
# https://stackoverflow.com/questions/50288034/unsatisfiedlinkerror-tmp-snappy-1-1-4-libsnappyjava-so-error-loading-shared-li
RUN apk add --update --no-cache libc6-compat snappy java-snappy-native
RUN ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2

# nginx -----------------------------------------------------------
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
EXPOSE 80

# Supervisor (multi-process docker) -------------------------------
RUN apk add supervisor
COPY supervisord.conf /etc/supervisor/conf.d/

# App configuration
WORKDIR /app
COPY . /app

# Supervisor config runs both nginx and gunicorn/flask: -----------
CMD /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
