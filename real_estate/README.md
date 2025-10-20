# Real Estate DApp - Polygon Blockchain

Una DApp (Decentralized Application) completa per la gestione di proprietà immobiliari tokenizzate come NFT su blockchain Polygon. Il progetto include smart contract Solidity, frontend React con TypeScript e Tailwind CSS 4, e supporto Docker.

## 🎯 Caratteristiche

- **Smart Contract Solidity**: Gestione completa di proprietà immobiliari come NFT ERC-721
- **Frontend React + TypeScript**: Interfaccia utente moderna e reattiva
- **Tailwind CSS 4**: Styling moderno e responsive
- **Web3 Integration**: Connessione con MetaMask e altri wallet
- **Polygon Network**: Deploy su testnet Polygon Amoy
- **Docker Support**: Containerizzazione con Ganache per sviluppo locale

## 📋 Prerequisiti

- Node.js >= 18.x
- npm o yarn
- Docker e Docker Compose (opzionale)
- MetaMask o altro wallet Web3

## 🚀 Setup Iniziale

### 1. Clona e installa dipendenze

```bash
# Installa dipendenze backend (Hardhat)
cd real_estate
npm install

# Installa dipendenze frontend
cd frontend
npm install
cd ..
```

### 2. Configurazione Environment Variables

```bash
# Copia il file .env di esempio
cp .env.example .env

# Modifica .env con le tue configurazioni
# - PRIVATE_KEY: Chiave privata del wallet per il deploy
# - POLYGON_AMOY_URL: URL RPC Polygon testnet
# - POLYGONSCAN_API_KEY: API key per verifica contratti
```

### 3. Avvia Ganache Locale (Opzione A - Con Docker)

```bash
# Avvia il container Ganache
docker-compose up -d ganache

# Verifica che Ganache sia attivo
docker-compose ps
```

### 3. Avvia Ganache Locale (Opzione B - Senza Docker)

```bash
# Installa Ganache globalmente
npm install -g ganache

# Avvia Ganache
ganache --wallet.totalAccounts=10 --wallet.defaultBalance=100 --chain.chainId=1337
```

## 📝 Compilazione e Deploy Smart Contract

### Compila i contratti

```bash
npm run compile
```

### Deploy su Ganache locale

```bash
# Assicurati che Ganache sia in esecuzione
npm run deploy:ganache
```

**IMPORTANTE**: Salva l'indirizzo del contratto deployato! Lo troverai nell'output:

```
✅ Contratto RealEstate deployato a: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Deploy su Polygon Testnet

```bash
# Assicurati di avere MATIC test nel wallet
npm run deploy:polygon
```

Per ottenere MATIC test: https://faucet.polygon.technology/

## 🎨 Setup Frontend

### 1. Configura le variabili d'ambiente

```bash
cd frontend
cp .env.example .env
```

Modifica `frontend/.env`:

```env
# Indirizzo del contratto deployato (dall'output del deploy)
VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Per Ganache locale
VITE_CHAIN_ID=1337
VITE_NETWORK_NAME=Ganache Local

# Per Polygon Testnet (decommentare se usi testnet)
# VITE_CHAIN_ID=80002
# VITE_NETWORK_NAME=Polygon Amoy Testnet
```

### 2. Avvia il frontend

```bash
npm run dev
```

Il frontend sarà disponibile su: http://localhost:5173

## 🔧 Configurazione MetaMask

### Per Ganache Locale

1. Apri MetaMask
2. Aggiungi una rete personalizzata:

   - **Nome Rete**: Ganache Local
   - **RPC URL**: http://127.0.0.1:8545
   - **Chain ID**: 1337
   - **Simbolo**: ETH

3. Importa un account da Ganache:
   - Copia una chiave privata da Ganache
   - MetaMask → Importa Account → Incolla chiave privata

### Per Polygon Amoy Testnet

1. Apri MetaMask
2. Aggiungi Polygon Amoy:

   - **Nome Rete**: Polygon Amoy Testnet
   - **RPC URL**: https://rpc-amoy.polygon.technology
   - **Chain ID**: 80002
   - **Simbolo**: MATIC
   - **Block Explorer**: https://amoy.polygonscan.com

3. Ottieni MATIC test dal faucet: https://faucet.polygon.technology/

## 🐳 Uso con Docker

### Avvia l'intero stack

```bash
# Avvia Ganache e Frontend
docker-compose up -d

# Verifica lo stato
docker-compose ps

# Visualizza i log
docker-compose logs -f
```

### Comandi utili Docker

```bash
# Ferma tutti i servizi
docker-compose down

# Rebuild dei container
docker-compose up -d --build

# Rimuovi volumi (reset completo)
docker-compose down -v
```

## 📱 Utilizzo della DApp

### 1. Connetti il Wallet

- Clicca su "Connetti Wallet"
- Approva la connessione in MetaMask
- Assicurati di essere sulla rete corretta

### 2. Naviga nel Marketplace

- Visualizza tutte le proprietà disponibili
- Vedi dettagli: prezzo, area, posizione, descrizione
- Clicca "Acquista Ora" per comprare una proprietà

### 3. Gestisci le Tue Proprietà

- Vai alla tab "Le Mie Proprietà"
- Metti in vendita le tue proprietà
- Cambia il prezzo
- Rimuovi dalla vendita

### 4. Aggiungi Nuove Proprietà

- Clicca "Aggiungi Proprietà"
- Compila il form con:
  - Nome proprietà
  - Descrizione
  - Posizione
  - Prezzo in ETH
  - Area in m²
  - URL immagine
- Conferma la transazione in MetaMask

## 📂 Struttura del Progetto

```
real_estate/
├── contracts/              # Smart contracts Solidity
│   └── RealEstate.sol     # Contratto principale
├── scripts/               # Script di deploy
│   └── deploy.ts          # Deploy script
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── components/    # Componenti React
│   │   ├── hooks/         # Custom hooks (useWeb3)
│   │   ├── types/         # TypeScript types
│   │   ├── utils/         # Utilities e constants
│   │   ├── App.tsx        # Componente principale
│   │   └── main.tsx       # Entry point
│   ├── Dockerfile         # Docker config frontend
│   └── package.json
├── docker-compose.yml     # Docker orchestration
├── hardhat.config.ts      # Configurazione Hardhat
├── package.json           # Dipendenze backend
└── README.md             # Questa documentazione
```

## 🔍 Test Smart Contract

```bash
# Esegui i test (se implementati)
npm test

# Test con coverage
npx hardhat coverage
```

## 🛠️ Comandi Utili

### Hardhat

```bash
# Compila contratti
npx hardhat compile

# Pulisci artifacts
npx hardhat clean

# Console Hardhat
npx hardhat console --network ganache

# Verifica contratto su PolygonScan
npx hardhat verify --network polygonAmoy DEPLOYED_CONTRACT_ADDRESS
```

### Frontend

```bash
cd frontend

# Avvia dev server
npm run dev

# Build per produzione
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

## 🎓 Funzionalità Smart Contract

### Funzioni Principali

- `listProperty()`: Lista una nuova proprietà come NFT
- `buyProperty()`: Acquista una proprietà pagando in ETH/MATIC
- `setForSale()`: Metti in vendita una proprietà posseduta
- `removeFromSale()`: Rimuovi dalla vendita
- `getPropertiesForSale()`: Ottieni tutte le proprietà in vendita
- `getMyProperties()`: Ottieni le proprietà di un indirizzo
- `getProperty()`: Dettagli di una proprietà specifica

### Eventi

- `PropertyListed`: Emesso quando una proprietà viene listata
- `PropertySold`: Emesso quando una proprietà viene venduta
- `PropertyPriceChanged`: Emesso quando il prezzo cambia
- `PropertyDelisted`: Emesso quando viene rimossa dalla vendita

## 🔒 Sicurezza

⚠️ **ATTENZIONE**: Questo è un progetto educativo/dimostrativo

- Non utilizzare chiavi private reali in `.env`
- Non committare mai file `.env` su Git
- Usa wallet di test per sviluppo
- Audita il codice prima di deploy in produzione

## 🐛 Troubleshooting

### MetaMask non si connette

- Verifica di essere sulla rete corretta (Chain ID)
- Resetta l'account MetaMask: Impostazioni → Avanzate → Resetta Account

### Errore "Insufficient funds"

- Assicurati di avere abbastanza ETH/MATIC nel wallet
- Per Ganache: usa un account con balance precaricato
- Per testnet: ottieni token dal faucet

### Contratto non trovato

- Verifica che `VITE_CONTRACT_ADDRESS` sia impostato correttamente
- Assicurati che il contratto sia deployato sulla rete attiva
- Controlla il Chain ID in `.env`

### Docker issues

```bash
# Riavvia tutti i container
docker-compose restart

# Rimuovi e ricrea
docker-compose down -v
docker-compose up -d --build
```

## 📚 Tecnologie Utilizzate

- **Solidity 0.8.20**: Smart contract
- **Hardhat**: Framework sviluppo Ethereum
- **OpenZeppelin**: Librerie sicure per contratti
- **React 18**: Framework frontend
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **Ethers.js v6**: Libreria Web3
- **Vite**: Build tool
- **Docker**: Containerizzazione
- **Ganache**: Blockchain locale

## 📄 Licenza

MIT License - Progetto educativo

## 🤝 Contributi

Questo è un progetto dimostrativo. Per miglioramenti:

1. Fork del progetto
2. Crea un branch per la feature
3. Commit delle modifiche
4. Push del branch
5. Apri una Pull Request

## 📞 Supporto

Per problemi o domande:

- Controlla la sezione Troubleshooting
- Verifica i log: `docker-compose logs` o console browser
- Consulta la documentazione Hardhat: https://hardhat.org/
- Documentazione Polygon: https://docs.polygon.technology/

---

**Buon coding! 🚀**
