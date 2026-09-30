#!/bin/sh

set -eu

: "${MAIL_DOMAIN:?MAIL_DOMAIN is required}"
: "${MAIL_HOSTNAME:?MAIL_HOSTNAME is required}"

postconf -e "myhostname = ${MAIL_HOSTNAME}"
postconf -e "mydomain = ${MAIL_DOMAIN}"
postconf -e "myorigin = \$mydomain"

postconf -e "virtual_alias_domains = ${MAIL_DOMAIN}"

postconf -e "transport_maps = hash:/etc/postfix/transport"

postconf -e "mynetworks = 127.0.0.0/8, 172.16.0.0/12"

postconf -e "smtpd_milters = inet:rspamd:11332"
postconf -e "non_smtpd_milters = inet:rspamd:11332"

postconf -e "milter_protocol = 6"
postconf -e "milter_default_action = accept"

postconf -e "maillog_file = /var/log/mail/mail.log"

postconf -e "compatibility_level = 3.6"

postfix check

exec postfix start-fg