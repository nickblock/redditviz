#!/bin/sh
redis-server ./redis.conf && \
node cache_primer.js &
node app.js
