

FROM node:10.10.0-alpine

ADD . /app

WORKDIR /app

RUN apk add python 
RUN apk add g++ make
RUN npm install

CMD [node app.js]