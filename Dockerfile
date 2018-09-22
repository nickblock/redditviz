

FROM node:10.10.0-alpine

ADD . /app

WORKDIR /app

RUN apk add python 
RUN apk add g++ make
RUN npm install

RUN apk add linux-headers
RUN wget http://download.redis.io/redis-stable.tar.gz && tar xvzf redis-stable.tar.gz && cd redis-stable && make

CMD [node app.js]
