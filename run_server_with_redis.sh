#!/bin/sh
redis-server ./redis.conf && \
node app.js
