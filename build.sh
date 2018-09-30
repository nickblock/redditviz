#!/bin/bash
browserify ./front/app.js --standalone redditviz -o public/bundle.js $@
