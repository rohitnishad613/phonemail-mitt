FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postfix \
        ca-certificates \
        gettext-base \
        rsyslog \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p \
    /var/spool/postfix \
    /etc/postfix \
    /var/log/mail

COPY main.cf /etc/postfix/main.cf
COPY master.cf /etc/postfix/master.cf
COPY transport /etc/postfix/transport
COPY entrypoint.sh /entrypoint.sh

RUN postmap /etc/postfix/transport

RUN chmod 0755 /entrypoint.sh

EXPOSE 25

ENTRYPOINT ["/entrypoint.sh"]