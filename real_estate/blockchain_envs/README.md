# 🔗 Blockchain Environments

Configurazioni Docker per diverse blockchain.

## 📁 Struttura

```
blockchain_envs/
├── ganache/          # Blockchain locale per sviluppo
│   ├── docker-compose.yml
│   └── README.md
└── polygon/          # Monitor per Polygon Testnet
    ├── docker-compose.yml
    ├── index.html
    ├── monitor-config.conf
    └── README.md
```

## 🏗️ Ganache (Locale)

Blockchain Ethereum locale per sviluppo rapido.

**Caratteristiche:**

- ⚡ Istantaneo (no mining delay)
- 💰 10 account con 100 ETH
- 🔄 Reset facile
- 🆓 Completamente gratuito

**Quando usare:**

- Sviluppo locale
- Test rapidi
- Debug contratti
- CI/CD pipeline

**Avvio:**

```bash
cd ganache
docker-compose up -d
```

**Dashboard:** http://172.30.32.1:7545

## 🔷 Polygon Amoy (Testnet)

Monitor e dashboard per Polygon Amoy Testnet.

**Caratteristiche:**

- 🌐 Rete pubblica testnet
- 🔍 PolygonScan integration
- 📊 Dashboard monitoring
- 💧 Faucet POL gratuito

**Quando usare:**

- Test pre-produzione
- Demo pubbliche
- Test di integrazione
- Verifica gas fees

**Avvio:**

```bash
cd polygon
docker-compose up -d
```

**Dashboard:** http://localhost:8080
**Log Viewer:** http://localhost:9999

## 🚀 Utilizzo con auto-setup.sh

Lo script `auto-setup.sh` nella root del progetto gestisce automaticamente:

1. **Selezione blockchain** (menu interattivo)
2. **Avvio Docker** (percorso corretto automatico)
3. **Deploy contratto** (network corretto)
4. **Configurazione frontend** (chain ID e RPC)

```bash
cd ../..
./auto-setup.sh
```

## 📊 Confronto

| Caratteristica  | Ganache    | Polygon Amoy        |
| --------------- | ---------- | ------------------- |
| **Velocità**    | Istantanea | ~2-5 secondi/blocco |
| **Costo**       | Gratis     | Gratis (testnet)    |
| **Network**     | Locale     | Pubblica            |
| **Reset**       | Facile     | Impossibile         |
| **Explorer**    | No         | PolygonScan         |
| **Faucet**      | N/A        | Disponibile         |
| **Persistenza** | Opzionale  | Permanente          |

## 🔧 Configurazione MetaMask

### Ganache

- **RPC**: http://172.30.32.1:7545
- **Chain ID**: 1337
- **Symbol**: ETH

### Polygon Amoy

- **RPC**: https://rpc-amoy.polygon.technology
- **Chain ID**: 80002
- **Symbol**: POL

## 🛑 Stop Tutti i Servizi

```bash
# Ganache
cd ganache && docker-compose down

# Polygon Monitor
cd polygon && docker-compose down
```

## 📝 Note

- **Ganache**: Blockchain completa in container
- **Polygon**: Solo monitoring (blockchain è pubblica)
- Entrambi possono girare contemporaneamente (porte diverse)
