#!/bin/bash
curl https://releases.rancher.com/install-docker/17.12.sh | sh
clear

echo '=== Welcome to Hostero Universal Miner installation ==='

if [ -z $1 ]; then
  echo 'Navigate to dashboard.hostero.eu and retrieve your ACCOUNT ID'
  echo ''
  echo -n 'Enter your ACCOUNT ID: '
  read account
else
  echo "ACCOUNT ID is set to $1"
  export account=$1
fi

echo ''
echo "Starting miner with ACCOUNT ID: $account"
echo ''

docker run -e CATTLE_HOST_LABELS="account=$account" --rm --privileged -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/rancher:/var/lib/rancher rancher/agent:v1.2.9 http://infra.hostero.eu:8080/v1/scripts/2E28C27EE87F5E1A6B7F:1514678400000:ShibdGaXFOlmN3QGGHj1UFuP1lU

echo 'Go to dashboard.hostero.eu and start mining'
