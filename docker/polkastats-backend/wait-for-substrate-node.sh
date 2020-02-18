#!/bin/sh
# wait-for-substrate-node.sh

NODE_URL=http://127.0.0.1:9944
cmd="$@"

until $(curl --output /dev/null --silent --head --fail ${NODE_URL}); do
  >&2 echo "Substrate node is unavailable - sleeping"
  sleep 1
done

>&2 echo "Substrate node is up - continuing with execution"
exec $cmd