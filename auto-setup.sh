#!/bin/bash

# 🚀 Script di Avvio Completo - Real Estate DApp
# Questo script esegue tutto il setup necessario in automatico

set -e

echo "================================================"
echo "   🏠 Real Estate DApp - Auto Setup"
echo "================================================"
echo ""

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Funzione per stampare con colore
print_step() {
    echo -e "${BLUE}➜ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Selezione blockchain
echo ""
echo "================================================"
echo "   🔗 Seleziona Blockchain"
echo "================================================"
echo ""
echo "1) Ganache (Locale - Per sviluppo)"
echo "2) Polygon Amoy (Testnet - Per test pubblici)"
echo ""
read -p "Scegli [1-2]: " blockchain_choice

case $blockchain_choice in
    1)
        BLOCKCHAIN="ganache"
        BLOCKCHAIN_NAME="Ganache Local"
        NETWORK_FLAG="--network ganache"
        DOCKER_PATH="blockchain_envs/ganache"
        CHAIN_ID="1337"
        RPC_URL="http://172.30.32.1:7545"
        print_success "✓ Selezionato: Ganache (Locale)"
        ;;
    2)
        BLOCKCHAIN="polygonAmoy"
        BLOCKCHAIN_NAME="Polygon Amoy Testnet"
        NETWORK_FLAG="--network polygonAmoy"
        DOCKER_PATH="blockchain_envs/polygon"
        CHAIN_ID="80002"
        RPC_URL="https://rpc-amoy.polygon.technology"
        print_success "✓ Selezionato: Polygon Amoy (Testnet)"
        
        print_warning "⚠️  IMPORTANTE: Assicurati di avere POL di test!"
        print_warning "   Ottieni POL: https://faucet.polygon.technology/"
        echo ""
        read -p "Hai già POL di test? (y/n): " has_pol
        if [ "$has_pol" != "y" ]; then
            print_error "Ottieni POL di test prima di continuare!"
            exit 1
        fi
        ;;
    *)
        print_error "Scelta non valida"
        exit 1
        ;;
esac

echo ""

# 1. Installa dipendenze
print_step "Installazione dipendenze..."
npm install
print_success "Dipendenze installate"

# 2. Crea file .env
if [ ! -f .env ]; then
    print_step "Creazione file .env..."
    cp .env.example .env
    
    # Chiave privata dell'account #0 di Ganache (SOLO PER TEST!)
    PRIVATE_KEY="0x734a7c7c580e464466f5c57ae6c86fa1f9a5fb010790e7911d56e9d42390e090"
    sed -i "s/your_private_key_here/$PRIVATE_KEY/" .env
    
    print_success "File .env creato con chiave di test"
    print_warning "⚠️  Usa questa chiave SOLO per test locale!"
else
    print_warning "File .env già esistente, skippo..."
fi

# 3. Compila contratti
print_step "Compilazione smart contracts..."
npm run compile
print_success "Contratti compilati"

# 4. Avvia Blockchain
if [ "$BLOCKCHAIN" = "ganache" ]; then
    print_step "Avvio Ganache con Docker..."
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        cd "$DOCKER_PATH"
        docker-compose up -d
        cd ../..
        print_success "Ganache avviato su http://172.30.32.1:7545"
        sleep 3
    else
        print_warning "Docker non trovato. Avvia Ganache manualmente!"
        read -p "Premi INVIO quando Ganache è avviato..."
    fi
elif [ "$BLOCKCHAIN" = "polygonAmoy" ]; then
    print_step "Avvio Polygon Monitor Dashboard..."
    if command -v docker-compose &> /dev/null || command -v docker &> /dev/null; then
        cd "$DOCKER_PATH"
        docker-compose up -d
        cd ../..
        print_success "Polygon Monitor avviato"
        print_success "Dashboard: http://localhost:8080"
        print_success "Log Viewer: http://localhost:9999"
        sleep 2
    else
        print_warning "Docker non disponibile - Monitor non avviato"
    fi
fi

# 5. Deploy contratto
print_step "Deploy smart contract su $BLOCKCHAIN_NAME..."
DEPLOY_OUTPUT=$(npx hardhat run scripts/deploy.ts $NETWORK_FLAG 2>&1)
echo "$DEPLOY_OUTPUT"

# Estrai l'indirizzo del contratto
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)

if [ -n "$CONTRACT_ADDRESS" ]; then
    print_success "Contratto deployato a: $CONTRACT_ADDRESS"
else
    print_error "Impossibile estrarre indirizzo contratto"
fi

# 6. Riepilogo
echo ""
echo "================================================"
echo -e "${GREEN}   ✅ Setup Completato!${NC}"
echo "================================================"
echo ""
echo "📋 Riepilogo:"
echo "  • Blockchain: $BLOCKCHAIN_NAME"
echo "  • RPC URL: $RPC_URL"
echo "  • Contract: $CONTRACT_ADDRESS"
echo "  • Chain ID: $CHAIN_ID"
echo ""

if [ "$BLOCKCHAIN" = "ganache" ]; then
    echo "🔑 Account Ganache #0 (per MetaMask):"
    echo "  Private Key: 0x734a7c7c580e464466f5c57ae6c86fa1f9a5fb010790e7911d56e9d42390e090"
    echo "  Address: 0x432137D963f5d16a4f35e1447EA657d0596b2067"
    echo ""
    echo "📝 Configura MetaMask:"
    echo "  • Rete: Ganache Local"
    echo "  • RPC: $RPC_URL"
    echo "  • Chain ID: $CHAIN_ID"
    echo "  • Simbolo: ETH"
elif [ "$BLOCKCHAIN" = "polygonAmoy" ]; then
    echo "🌐 Link Utili:"
    echo "  • PolygonScan: https://amoy.polygonscan.com/address/$CONTRACT_ADDRESS"
    echo "  • Faucet POL: https://faucet.polygon.technology/"
    echo "  • Monitor Dashboard: http://localhost:8080"
    echo "  • Log Viewer: http://localhost:9999"
    echo ""
    echo "📝 Configura MetaMask:"
    echo "  • Rete: Polygon Amoy Testnet"
    echo "  • RPC: $RPC_URL"
    echo "  • Chain ID: $CHAIN_ID"
    echo "  • Simbolo: POL"
fi

echo ""
echo "🚀 Prossimi passi:"
echo "  1. Configura MetaMask (vedi sopra)"
echo "  2. Importa/Usa account con fondi"
echo "  3. Copia CONTRACT_ADDRESS nel .env della landing-page"
echo ""
echo "================================================"
echo ""
