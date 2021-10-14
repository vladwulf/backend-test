# Backend Dev Onboarding Test

## Instruction (dev)

```
yarn // (or npm i) install packages
yarn run db:restart // will install mongo and clean any previous instance with docker-compose
yarn start:dev // start app in dev mode
```

### Description

The app is made of several modules:

- chain module: manages the blockchain providers, signers and smart contracts
- common module: miscellanious helpers
- config module: loads env vars from dotenv
- mongo module: manages mongo connection
- user module: stores the graph for user as well as the resolver
- worker module: asynchonously fetches events from the smart contract (works only on kovan)
