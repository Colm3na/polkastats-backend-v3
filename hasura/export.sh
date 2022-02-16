#!/bin/sh

usage() { echo "Usage: $0 [-d <dev host string>] [-k <key dev string>]" 1>&2; exit 1; }

while getopts ":d:k:s:i" flag
do
    case "${flag}" in
        d) d=${OPTARG};;
        k) k=${OPTARG};;                
    esac
done

if [ -z "${d}" ] || [ -z "${k}" ]; then
    usage
fi

dev_url="$d/v1/metadata"
hasura_key="X-Hasura-Admin-Secret: ${k}";

curl -d'{"type": "export_metadata", "args": {}}' $dev_url  \
-o hasura_metadata.json  \
-H "$hasura_key"


#exit 0