# nCent Sandbox

- [Introduction](#introduction)
- [Models](#models)
- [Local Installation](#local-installation)
- [Endpoint Documentation](#endpoints-documentation)

## Introduction
The nCent Sandbox is a test environment for developers to emulate the upcoming nCent Core Protocol for the purposes of application development. In its current stage, it is designed with a Node.js backend with an Express server and a PostgreSQL database. While this architecture is clearly centralized by nature, it is merely a placeholder to allow developers to interact with our API and SDK, which will be directly transferrable to our Core Protocol as it becomes available.

## Models
The following section is a quick reference of the Node.js models that comprise the nCent Sandbox

### Wallet
A wallet is simply the Stellar keypair implementation. **We do not store private key information on our sandbox**. A Wallet has the following attributes:

- uuid: the primary key, or unique identifier, for each Wallet
- address: the Stellar public key for the wallet

### TokenType
One of the unique aspects of the nCent Protocol is the ability for users to **stamp** NCNT tokens for the purposes of their specific use cases. **TokenType** is the model that tracks the various different stamped NCNT token types. This model has the following attributes:

- uuid: the primary key, or unique identifier, for each TokenType
- name: the title of the stamped token
- expiryDate: the expiration date of the stamped tokens
- sponsorUuid: the wallet address that was responsible for stamping the tokens, also known as the **sponsor**
- totalTokens: the total amount of tokens of this type that were stamped by the sponsor

### Challenge
A challenge can be thought of as the container for a set of stamped tokens. More specifically, a challenge is *why* a sponsor would stamp tokens in the first place. For example, a user might want to incentivize the hiring of an employee for a job role via referrals. The **challenge** would be to get a job candidate hired for the role. A challenge can be sponsored by a user, who will stamp tokens and attach them to the redemption of the challenge. Then, the challenge can be transferred to other users' wallets until one ultimately **redeems** the challenge. A Challenge has the following attributes:

- uuid: the primary key, or unique identifier, for each Challenge
- name: the title of the challenge
- expiration: the expiration date of the challenge (will usually correspond with the expiration date of the stamped tokens)
- rewardAmount: the **maximum** amount of stamped tokens that will be distributed among the participants along a **provenance chain** (more on this later)
- sponsorWalletAddress: the wallet address that was responsible for sponsoring the challenge
- isRedeemed: a boolean representing whether or not the challenge has been redeemed or not

### Transaction
Given our definition of a "Challenge" above, Transactions are a bit more self-explanatory. A transaction is simply the transfer model of a challenge between users via their Wallets. Transactions have the following attributes:

- uuid: the primary key, or unique identifier, for each Transaction
- parentTransaction: a foreign key pointing to the transaction that preceeded this one, should one exist
- amount: the number of tokens included in the transaction
- fromAddress: the wallet address of the sender of the challenge
- toAddress: the wallet address of the recipient of the challenge

## Local Installation

### Using Docker to run the sandbox locally

First install docker locally: https://www.docker.com/products/docker-desktop

#### Configure postgres
```
psql -U postgres
postgres=# SHOW config_file;
```
Navigate to your pg_hba.conf file and add this line:
`host    ncent-db        all             172.17.0.0/16           trust`
Navigate to your postgresql.conf file and change the following:

`#listen_addresses = 'localhost'` to `#listen_addresses = '*'`

Change your postgres user's password to 'dickey'

#### Run a Postgres server and build/run the sandbox docker image
```bash
createdb ncent-db
sh execDockerSetup.sh
```

**if the migrations fail when running the shell script, stop the docker container (command listed below) and run the shell script again**

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
**First, make sure your docker container is not running via the above command**
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
We also have our own instance of the sandbox hosted on AWS via Elastic Container Service. To access its APIs, simply add the routes detailed in the endpoints section below to the IP Address and port of our hosted instance: http://18.219.110.45:8010/api

## Endpoints Documentation

The Sandbox API routes are detailed [here](/server/routes/index/js).

- [Get All Wallets](#get-all-wallets)
- [Get Wallet](#get-wallet)
- [Get Wallet Balance](#get-wallet-balance)
- [Stamp Token](#stamp-token)
- [Get All TokenTypes](#get-all-token-types)
- [Get TokenType](#get-token-type)
- [Get All Challenges](#get-all-challenges)
- [Get Challenge](#get-challenge)
- [Create Challenge](#create-challenge)
- [Retrieve Sponsored Challenges](#retrieve-sponsored-challenges)
- [Retrieve Held Challenges](#retrieve-held-challenges)
- [Get All Transactions](#get-all-transactions)
- [Create Transaction](#create-a-transaction)
- [Share Challenge](#share-a-challenge)
- [Redeem a Challenge](#redeem-a-challenge)
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


## Get Wallet
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
Instantiate a new token type. In the current implementation, this creates new tokens from nothing. In production, one can only stamp NCNT into a new TokenType
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

## Get All TokenTypes
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

## Get TokenType
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

