#!/bin/sh
redis-server ./redis.conf && \
pm2 start app.js
pm2 start cache_primer.js
