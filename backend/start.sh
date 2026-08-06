#!/bin/sh

set -e

echo "Starting Spring Boot on port 10001..."

java -Dserver.port=10001 -jar /app/app.jar &

JAVA_PID=$!

echo "Starting Nginx on port 10000..."

nginx -g "daemon off;" &

NGINX_PID=$!

trap 'kill $JAVA_PID $NGINX_PID 2>/dev/null || true' TERM INT

wait -n $JAVA_PID $NGINX_PID