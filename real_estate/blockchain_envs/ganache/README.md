# 🏗️ Ganache Local Blockchain

Blockchain Ethereum locale per sviluppo e testing.

## 🚀 Avvio

```bash
docker-compose up -d
```

## 📊 Configurazione

- **RPC URL**: http://172.30.32.1:7545 (WSL) o http://localhost:7545
- **Chain ID**: 1337
- **Mnemonic**: `million ice trip field economy number ritual metal still quit monkey crane`
- **Accounts**: 10 account con 100 ETH ciascuno
- **Gas Limit**: 12,000,000

## 🔑 Account Predefiniti

Gli account sono generati dal mnemonic sopra. Primi 3 account:

1. **Account 0**

   - Address: `0x432137D963f5d16a4f35e1447EA657d0596b2067`
   - Private Key: `0x734a7c7c580e464466f5c57ae6c86fa1f9a5fb010790e7911d56e9d42390e090`

2. **Account 1**

   - Address: `0x497E83AD9384B7CdD6CA4c954E0747662F4AF94C`
   - Private Key: `0xc0b67d2b0c8e5a205de4ccbfad15ca3f420e6cbfea1167b09a98dad512b7d657`

3. **Account 2**
   - Address: `0x4593D18cbb27F15aFd95E173e4f44B133b5De58D`
   - Private Key: `0x4c6bb75b0f3e2bf4700e3b76d7dc9d9f55043924d4a55fb7c41e7d5405386313`

## 📝 Configurazione MetaMask

1. Aggiungi rete personalizzata:

   - **Nome rete**: Ganache Local
   - **RPC URL**: http://172.30.32.1:7545
   - **Chain ID**: 1337
   - **Simbolo valuta**: ETH

2. Importa account usando una delle private key sopra

## 🔍 Verifica Ganache

```bash
# Verifica che Ganache sia in esecuzione
docker ps | grep ganache

# Vedi i log
docker logs ganache-real-estate

# Testa la connessione
curl -X POST http://172.30.32.1:7545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 🛑 Stop

```bash
docker-compose down
```

## 🔄 Restart

```bash
docker-compose restart
```

## 🗑️ Reset completo (cancella dati blockchain)

```bash
docker-compose down -v
docker-compose up -d
```

## 📦 Comandi Utili

```bash
# Deploy contratto
cd ../.. && npx hardhat run scripts/deploy.ts --network ganache

# Esegui test
cd ../.. && npx hardhat test --network ganache

# Console Hardhat
cd ../.. && npx hardhat console --network ganache
```

## ⚠️ Note WSL

Su WSL2, usa `172.30.32.1` invece di `localhost` per connetterti a Ganache da:

- Hardhat
- MetaMask
- Frontend

All'interno dei container Docker, usa `ganache:8545`.
