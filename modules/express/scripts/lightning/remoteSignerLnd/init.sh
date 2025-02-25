#!/bin/bash -e

echo "== Configuring Remote Signer =="

echo "  --- Ensuring LND Directory Exists ---"
mkdir -p /lnd

echo "  --- Checking Environment Variables ---"
if [[ ${BITCOIN_NETWORK} ]];
then
    if [[ "$BITCOIN_NETWORK" =~ ^(mainnet|testnet|signet|regtest)$ ]];
    then
        echo "  --- Found network: $BITCOIN_NETWORK. Continuing... ---"
    else
        echo "  --- Unsupported value for BITCOIN_NETWORK: $BITCOIN_NETWORK! Exiting... ---"
        exit 1
    fi
else
    echo "  --- Required variable BITCOIN_NETWORK not set! Exiting... ---"
    exit 1
fi

echo "  --- Checking TLS Settings ---"
if [[ ${TLS_CERT} && ${TLS_KEY} ]];
then
    echo "  --- Writing TLS Certificate ---"
    echo $TLS_CERT | base64 -d > /lnd/tls.cert
    echo "  --- Done writing TLS Certificate ---"
    echo "  --- Writing TLS Private Key ---"
    echo $TLS_KEY | base64 -d > /lnd/tls.key
    echo "  --- Done writing TLS Private Key ---"
else
    echo "  --- TLS Variables Not Set. Skipping... ---"
fi

echo "  --- Writing the configuration file ---"
cat /config.conf | sed "s/networkreplace/$BITCOIN_NETWORK/g" > /lnd/lnd.conf

echo "== Starting LND =="
/bin/lnd --configfile=/lnd/lnd.conf > /dev/null &

sleep 2

echo "  --- Found the following TLS Cert: ---"
cat /lnd/tls.cert

echo "  --- LND Logs: ---"
tail -f /lnd/logs/bitcoin/${BITCOIN_NETWORK}/lnd.log
