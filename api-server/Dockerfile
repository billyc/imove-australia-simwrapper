FROM nginx:alpine

# python ----------------------------------------------------------
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN pip3 install --no-cache --upgrade pip setuptools

# Flask/Gunicorn --------------------------------------------------
RUN pip3 install --no-cache gunicorn flask flask-restful flask-reuploaded flask-cors

# nginx -----------------------------------------------------------
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/
#COPY htpasswd /etc/nginx/htpasswd
EXPOSE 80

# Supervisor (multi-process docker) -------------------------------
RUN apk add supervisor
COPY supervisord.conf /etc/supervisor/conf.d/

# App configuration
WORKDIR /app
COPY . /app

# Supervisor config runs both nginx and gunicorn/flask: -----------
CMD /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

