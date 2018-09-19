# nCent Sandbox

- [Local Installation](#local-installation)
- [Endpoint Documentation](#endpoints-documentation)

## Introduction
The nCent Sandbox allows you to run a server that mimics the nCent Core Protocol. In its current stage, it stores the information on the tokentypes, transactions and wallets on a (PostgreSQL) database.

The Sandbox API routes are detailed [here](/server/routes/index/js).

## Local Installation

### Using Docker to run the sandbox locally

First install docker locally: https://www.docker.com/products/docker-desktop

#### Create a secret.env
```bash
DB_USERNAME=postgres
DB_PASSWORD=dickey
DB_HOST=docker.for.mac.host.internal
DB_PORT=5432
TOKEN_GRAVEYARD_ADDRESS=#valid publicKey
VERSION=local_v
```

#### Configure postgres
```
psql -U postgres
postgres=# SHOW config_file;
```
Navigate to your pg_hba.conf file and add this line:
`host    ncent-db        all             172.17.0.0/16           trust`
Navigate to your postgresql.conf file and change the following:

`#listen_addresses = 'localhost'` to `#listen_addresses = '*'`

#### Run a Postgres server and build/run the sandbox docker image
```bash
createdb ncent-db
sh execDockerSetup.sh
```

#### Access the sandbox apis

From your local machine:

```
curl http://localhost:8010/api
{"message":"Welcome to the NCNT API!"}

curl http://localhost:8010/api/wallets
[]
```

#### Debugging

To view the logs of the docker container:

```
docker logs sandboxContainer
```

#### Stop the container

```
docker rm -f sandboxContainer
```

#### Run tests

```
dropdb ncent-db
createdb ncent-db
```
Navigate to your server folder and run:
```
../node_modules/.bin/sequelize db:migrate
```
Navigate to your main directory and run:
```
npm run test
```

### Accessing the Sandbox Remotely
We also have our own instance of the sandbox hosted on AWS. To access its APIs, simply add the routes detailed in the endpoints section below to the IP Address and port of our hosted instance: http://18.219.87.29:8010/api

## Endpoints Documentation

- [Get All Wallets](#get-all-wallets)
- [Get Specific Wallet](#get-specific-wallet)
- [Get Wallet Balance](#get-wallet-balance)
- [Stamp Token](#stamp-token)
- [List Token Types](#list-token-types)
- [Get Specific Token Information](#get-specific-token-information)
- [Get All Transactions](#get-all-transactions)
- [Create a Challenge (Transaction)](#create-a-challenge-transaction)
- [Share a Challenge (Transaction)](#share-a-challenge-transaction)
- [Redeem a Challenge (Transaction)](#redeem-a-challenge-transaction)
- [Retrieve Provenance Chain of a Transaction](#retrieve-provenance-chain-of-a-transaction)
- [Retrieve Provenance Chain (FIFO)](#retrieve-provenance-chain-fifo)

- - - -

## Get All Wallets
#### `GET /api/wallets`
#### Description:
Retrieve information about all wallets.
#### Paramters:
None
#### Body:
None

- - - -
<br />

- - - -


## Get Specific Wallet
#### `GET api/wallets/{address}`
#### Description:
Retrieve information about a specific wallet
#### Parameters:
Name  | Type | Description
--- | --- | ---
address | String | Valid wallet public key
#### Body:
None

- - - -
<br />

- - - -


## Get Wallet Balance
#### `GET api/wallets/{address}/{tokenTypeUuid}`
#### Description:
Retrieve information about how much of a specific token a wallet holds
#### Parameters:
Name  | Type | Description
--- | --- | ---
address | String | Valid wallet public key
tokenTypeUuid | String | Valid TokenTypeUUID
#### Body:
None

- - - -
<br />

- - - -

## Stamp Token
#### `POST api/tokentypes`
#### Description:
Instantiate a new token type. In the current implementation, this creates new tokens from nothing. In production, one can only stamp nCent into a new TokenType
#### Parameters:
None
#### Body:
Name  | Type | Description
--- | --- | ---
sponsorUuid | String | Valid public key of token sponsor
name | String | Token Name
totalTokens | Int | Number of tokens to be stamped
expiryDate | Date Object | The expiration date of the tokens stamped into existance

- - - -
<br />

- - - -

## List Token Types
#### `GET api/tokentypes`
#### Description:
Lists all token types and the transactions associated with them
#### Parameters:
None
#### Body:
None

- - - -
<br />

- - - -

## Get Specific Token Information
#### `GET api/tokentypes/{tokenTypeUuid}`
#### Description:
Lists information about a specific token type and the transactions associated with it
#### Parameters:
Name  | Type | Description
--- | --- | ---
tokenTypeUuid | String | Unique identifier for a specific token type
#### Body:
None

- - - -
<br />

- - - -

## Get All Transactions
#### `GET api/transactions/`
#### Description:
Gets all transactions
#### Parameters:
none
#### Body:
none
- - - -
<br />

- - - -

## Create a Challenge (Transaction)
#### `POST /api/transactions/{tokenTypeUuid}/{address}`
#### Description:
Creates a challenge from the wallet of a TokenType creator to be shared with another wallet.
#### Parameters:
Name  | Type | Description
--- | --- | ---
tokenTypeUuid | String | Unique identifier for a specific token type
address | String | Valid Wallet address
#### Body:
Name  | Type | Description
--- | --- | ---
amount | Int | Amount of TokenType to transfer
signed | String | JSON string of signed message object

- - - -
<br />

- - - -

## Share a Challenge (Transaction)
#### `POST /api/transactions/{transactionUuid}`
#### Description:
Shares a challenge via a transaction from one wallet to another
#### Parameters:
Name  | Type | Description
--- | --- | ---
transactionUuid | String | Unique identifier for a specific token type
#### Body:
Name  | Type | Description
--- | --- | ---
fromAddress | String | Valid public key of sender
toAddress | String | Valid public key of receiver
signed | String | JSON string of signed message object

- - - -
<br />

- - - -

## Redeem a Challenge (Transaction)
#### `POST /api/transactions/redeem`
#### Description:
Redeems a challenge from a wallet
#### Parameters:
none
#### Body:
Name  | Type | Description
--- | --- | ---
transactionUuid | Int | Unique identifier for a transaction
signed | String | JSON string of signed message object (signed by the TokenType creator)
- - - -
<br />

- - - -
## Retrieve Provenance Chain of a Transaction
#### `GET /api/transactions/{transactionUuid}`
#### Description:
Retrieves the provenance of a transaction via its parentTransactions
#### Parameters:
Name  | Type | Description
--- | --- | ---
transactionUuid | String | Unique identifier for a specific transaction
#### Body:
none
- - - -
<br />

- - - -
## Retrieve Provenance Chain (FIFO)
#### `GET /api/transactions/{tokenTypeUuid}/{address}`
#### Description:
Retrieves the provenance of a publicKey's first owned challenge of a specific TokenType
#### Parameters:
Name  | Type | Description
--- | --- | ---
address | String | Valid Wallet public key
tokenTypeUuid | String | Valid UUID of a TokenType
#### Body:
none
- - - -

