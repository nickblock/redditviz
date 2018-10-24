

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

RUN npm install -g browserify

ADD package.json /app/
ADD package-lock.json /app/
WORKDIR /app
RUN npm install

ADD . .
RUN browserify ./front/app.js  -g uglifyify --standalone redditviz -o public/bundle.js

CMD ./run_server_with_redis.sh
