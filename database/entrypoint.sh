#!/bin/bash
set -e

echo "host  all all 172.18.0.0/24   trust" >> /etc/postgresql/15/main/pg_hba.conf


exec pg_ctlcluster 15 main start --foreground