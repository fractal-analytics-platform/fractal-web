#!/bin/sh

set -e

echo "This is a fake task"
i=0

while true; do
  status=`curl -s http://localhost:8080?task=$2`
  if [ "$status" = "done" ]; then
    echo "Fake task completed successfully"
    exit 0
  elif [ "$status" = "failed" ]; then
    >&2 echo "Fake task failed"
    exit 1
  fi
  echo "Fake task is running... ($i)"
  i=$((i+1))
  sleep 1
done
