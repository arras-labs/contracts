# 🔷 Polygon Monitor Dashboard

Dashboard di monitoring per Polygon Amoy Testnet.

## 🚀 Avvio

```bash
docker-compose up -d
```

## 📊 Servizi Disponibili

### 1. **Polygon Dashboard** (porta 8080)

- URL: http://localhost:8080
- Dashboard HTML con link rapidi a:
  - PolygonScan Explorer
  - Faucet POL
  - RPC endpoints
  - Documentazione

### 2. **Log Viewer - Dozzle** (porta 9999)

- URL: http://localhost:9999
- Visualizza i log di tutti i container Docker in tempo reale
- Utile per debuggare transazioni e deploy

## 🔗 Link Utili

- **PolygonScan Amoy**: https://amoy.polygonscan.com/
- **Faucet POL**: https://faucet.polygon.technology/
- **RPC URL**: https://rpc-amoy.polygon.technology
- **Chain ID**: 80002

## 📝 Note

Polygon è una blockchain pubblica, quindi non può essere eseguita localmente come Ganache.

Questo setup fornisce:

- ✅ Dashboard di monitoring
- ✅ Log viewer Docker
- ✅ Link rapidi agli explorer
- ✅ Monitoraggio chiamate RPC (opzionale)

Per vedere le transazioni del tuo contratto:

1. Copia l'indirizzo del contratto da `frontend/.env`
2. Vai su https://amoy.polygonscan.com/
3. Cerca l'indirizzo
4. Visualizza transazioni, eventi e codice sorgente

## 🛑 Stop

```bash
docker-compose down
```

## 🔄 Restart

```bash
docker-compose restart
```
