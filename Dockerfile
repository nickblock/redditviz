

FROM node:10.10.0-alpine

RUN apk add python 
RUN apk add g++ make

RUN apk add linux-headers
RUN wget http://download.redis.io/redis-stable.tar.gz && \
	tar xvzf redis-stable.tar.gz && \
	cd redis-stable && \
	make -j && make install && \
	cd .. && \
	rm -r redis-stable && rm redis-stable.tar.gz

ADD . /app
WORKDIR /app
RUN npm install

CMD ./run_server_with_redis.sh
