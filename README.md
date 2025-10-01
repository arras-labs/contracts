# Contracts

## Purpose
Author and test the smart contracts. Produce **ABIs** as build artefacts for other services.

## Responsibilities
- Contract source and tests
- Deployment scripts and configuration per environment
- Publishing **ABIs** (and optionally bytecode) for clients

## Interfaces (in / out)
- **Out:** ABIs published as build or release artefacts
- **In:** Chain RPC (devnet/testnet/mainnet)

## Interactions with other repositories
- **web-app** consumes ABIs for read-only decoding; **writes** go via **backend-api**
- **backend-api** uses ABIs to encode/decode on-chain calls and events
- **deploy** stores runbooks/manifests that reference deployed addresses

## Directory layout
- `src/` Solidity contracts
- `test/` unit/integration tests
- `scripts/` deployment scripts
- `out/` build outputs (ignored unless noted)

## Local development
1. Install the chosen toolchain (e.g. **Foundry** or **Hardhat**)
2. Build and run tests locally
3. On release, publish ABIs as artefacts

## CI/CD
- On PR/push: build & test
- On tag (release): upload **ABIs** as release artefacts for `web-app` and `backend-api`

## Versioning & releases
- Tag contract releases (e.g. `contracts-v0.1.0`)
- Record deployed addresses per environment

## Security
Report vulnerabilities privately to the maintainers. Do not disclose before a coordinated fix.
