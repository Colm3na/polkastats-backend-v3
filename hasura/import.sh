#!/bin/sh

usage() { echo "Usage: $0 [-d <stage | prod host string>] [-k <key dev string>]" 1>&2; exit 1; }

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

prod_url="$d/v1/metadata"
hasura_key="X-Hasura-Admin-Secret: ${k}";


curl -d'{"type":"replace_metadata", "args":'$(cat hasura_metadata.json)'}' \
$prod_url \
-H "$hasura_key"