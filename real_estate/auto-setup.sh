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

# 1. Installa dipendenze
print_step "Installazione dipendenze backend..."
npm install
print_success "Dipendenze backend installate"

print_step "Installazione dipendenze frontend..."
cd frontend
npm install
cd ..
print_success "Dipendenze frontend installate"

# 2. Crea file .env
if [ ! -f .env ]; then
    print_step "Creazione file .env..."
    cp .env.example .env
    
    # Genera una chiave privata di test (SOLO PER TEST!)
    PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    sed -i "s/your_private_key_here/$PRIVATE_KEY/" .env
    
    print_success "File .env creato con chiave di test"
    print_warning "⚠️  Usa questa chiave SOLO per test locale!"
else
    print_warning "File .env già esistente, skippo..."
fi

if [ ! -f frontend/.env ]; then
    print_step "Creazione frontend/.env..."
    cp frontend/.env.example frontend/.env
    print_success "File frontend/.env creato"
else
    print_warning "File frontend/.env già esistente, skippo..."
fi

# 3. Compila contratti
print_step "Compilazione smart contracts..."
npm run compile
print_success "Contratti compilati"

# 4. Avvia Ganache
print_step "Avvio Ganache..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d ganache
    print_success "Ganache avviato con Docker"
    sleep 3
else
    print_warning "Docker non trovato. Avvia Ganache manualmente!"
    print_warning "Comando: ganache --chain.chainId=1337"
    read -p "Premi INVIO quando Ganache è avviato..."
fi

# 5. Deploy contratto
print_step "Deploy smart contract su Ganache..."
DEPLOY_OUTPUT=$(npm run deploy:ganache 2>&1)
echo "$DEPLOY_OUTPUT"

# Estrai l'indirizzo del contratto
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)

if [ -n "$CONTRACT_ADDRESS" ]; then
    print_success "Contratto deployato a: $CONTRACT_ADDRESS"
    
    # Aggiorna frontend/.env
    print_step "Aggiornamento frontend/.env..."
    if grep -q "VITE_CONTRACT_ADDRESS=" frontend/.env; then
        sed -i "s/VITE_CONTRACT_ADDRESS=.*/VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS/" frontend/.env
    else
        echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> frontend/.env
    fi
    print_success "Frontend configurato"
else
    print_error "Impossibile estrarre indirizzo contratto"
    print_warning "Configura manualmente frontend/.env"
fi

# 6. Riepilogo
echo ""
echo "================================================"
echo -e "${GREEN}   ✅ Setup Completato!${NC}"
echo "================================================"
echo ""
echo "📋 Riepilogo:"
echo "  • Ganache: http://127.0.0.1:8545"
echo "  • Contract: $CONTRACT_ADDRESS"
echo "  • Chain ID: 1337"
echo ""
echo "🔑 Account Ganache (per MetaMask):"
echo "  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo ""
echo "📝 Prossimi passi:"
echo "  1. Configura MetaMask:"
echo "     • Rete: Ganache Local"
echo "     • RPC: http://127.0.0.1:8545"
echo "     • Chain ID: 1337"
echo "     • Simbolo: ETH"
echo ""
echo "  2. Importa account in MetaMask:"
echo "     • Usa la private key sopra"
echo ""
echo "  3. Avvia il frontend:"
echo "     cd frontend && npm run dev"
echo ""
echo "  4. Apri browser:"
echo "     http://localhost:5173"
echo ""
echo "================================================"
echo ""

read -p "Vuoi avviare il frontend ora? (y/n): " start_frontend

if [ "$start_frontend" = "y" ]; then
    print_step "Avvio frontend..."
    cd frontend
    npm run dev
else
    echo ""
    echo "Per avviare il frontend in seguito:"
    echo "  cd frontend && npm run dev"
    echo ""
fi
