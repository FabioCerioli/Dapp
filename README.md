# Piattaforma di Voto Decentralizzata (Hybrid dApp)

## Relazione Tecnica e Architetturale

---

## 1. Introduzione e Obiettivi

Il presente progetto descrive la progettazione e lo sviluppo di una **Decentralized Application (dApp)** per la gestione di votazioni elettroniche.

L'obiettivo principale è superare le criticità dei sistemi di voto tradizionali, tra cui:
- la necessità di fiducia in un'autorità centrale;
- il rischio di manipolazione dei dati;
- la scarsa trasparenza dei processi.

La soluzione proposta sfrutta le proprietà fondamentali della tecnologia **Blockchain**, in particolare:
- **immutabilità dei dati**;
- **trasparenza verificabile**;
- **sicurezza crittografica**.

Per garantire al contempo scalabilità e una moderna esperienza utente, il sistema adotta un’**architettura ibrida (On-Chain + Off-Chain)**, combinando servizi web tradizionali con logiche decentralizzate.

---

## 2. Architettura del Sistema

L'infrastruttura è organizzata in tre livelli logici distinti, ciascuno con responsabilità specifiche.

### 2.1 Panoramica Architetturale

| Livello Logico     | Stack Tecnologico                  | Responsabilità |
|-------------------|-----------------------------------|---------------|
| **Blockchain**     | Solidity, Ethereum, Hardhat       | Gestione immutabile dello stato dell’elezione, conteggio voti, prevenzione frodi |
| **Backend**        | Node.js, Express, JSON            | Gestione dati off-chain e contenuti multimediali |
| **Frontend**       | React (Vite), Ethers.js, Recharts | Interfaccia utente, integrazione Web3 e visualizzazione dati |

### 2.2 Scelte di Design

L’architettura ibrida consente di:
- evitare costi elevati di **Gas** per l’archiviazione di contenuti multimediali;
- mantenere lo **Smart Contract leggero ed efficiente**;
- delegare al backend la gestione dei dati non critici per la sicurezza.

---

## 3. Analisi dei Componenti

### 3.1 Smart Contract (`Voting.sol`)

Il contratto intelligente rappresenta il nucleo logico e crittografico del sistema.

#### Strutture Dati
- `struct Candidate`: contiene identificativo e conteggio voti.
- `mapping(address => bool) voters`: registro elettorale per prevenire il doppio voto.

#### Gestione del Ciclo di Vita
- Variabili:
  - `electionStarted`
  - `electionEnded`
- Implementazione del pattern **Ownership** per il controllo amministrativo.

#### Sicurezza e Controllo Accessi
- Utilizzo del modificatore `onlyOwner` per limitare le operazioni critiche.

#### Logica di Voto
La funzione di voto esegue i seguenti controlli:
1. Verifica che l’elezione sia attiva;
2. Controllo dell’unicità del voto;
3. Registrazione del votante;
4. Incremento del contatore del candidato.

---

### 3.2 Backend (`server.js`)

Il backend è un servizio HTTP asincrono basato su architettura RESTful.

#### Database
- File JSON utilizzati come database.
- Contiene:
  - dati anagrafici dei candidati;
  - affiliazioni politiche;
  - URL delle immagini.

---

### 3.3 Frontend (`App.jsx`)

Il frontend è sviluppato in React e rappresenta l’interfaccia utente della piattaforma.

#### Aggregazione Dati
- Recupero dati:
  - On-chain tramite RPC;
  - Off-chain tramite API REST.
- Fusione dei dataset tramite ID del candidato.

#### Integrazione Web3
- Utilizzo di `window.ethereum` per rilevare wallet compatibili.
- Firma delle transazioni tramite provider (es. MetaMask).
- Uso di **Ethers.js** per l'interazione con la blockchain.

#### Gestione dei Dati
- Conversione dei tipi `BigInt` in `Number` per compatibilità JavaScript.

#### Visualizzazione
- Dashboard real-time tramite **Recharts**:
  - Istogramma dei voti;
  - Grafico a torta per distribuzione percentuale.

---

## 4. Testing e Validazione

### 4.1 Unit Testing
- Framework: Hardhat 
- Verifiche:
  - corretta inizializzazione;
  - integrità del conteggio voti;
  - prevenzione del doppio voto (`revertedWith`).

### 4.2 Simulazione di Carico
- Script `simulate-votes.ts`
- Simulazione di votazioni simultanee utilizzando account multipli.
- Verifica della resilienza sotto carico concorrente.

---

## 5. Flusso Utente

1. **Inizializzazione**
   - Deploy dello Smart Contract;
   - Avvio del backend.

2. **Apertura Elezione**
   - Invocazione della funzione `startElection`.

3. **Accesso Utente**
   - Caricamento e sincronizzazione dei dati.

4. **Votazione**
   - Selezione candidato;
   - Firma della transazione tramite wallet.

5. **Aggiornamento**
   - Inclusione della transazione in blockchain;
   - Aggiornamento in tempo reale della dashboard.

6. **Chiusura Elezione**
   - Invocazione di `endElection`;
   - Blocco definitivo delle votazioni.

---

## 6. Conclusioni

La piattaforma realizzata soddisfa pienamente i requisiti progettuali, integrando:

- **Tecnologie Web tradizionali** per la gestione dei dati e dei contenuti;
- **Tecnologia Blockchain** per garantire integrità, trasparenza e sicurezza;
- **Strumenti di analisi dati** per una visualizzazione efficace dei risultati.

Il sistema risultante è:
- **resistente alla censura**, grazie alla persistenza on-chain dei dati;
- **sicuro e verificabile**, grazie alla logica crittografica;
- **scalabile e usabile**, grazie all’architettura ibrida.

---

## 7. Tecnologie Utilizzate

- Solidity
- Ethereum
- Hardhat
- Node.js
- Express
- React (Vite)
- Ethers.js
- Recharts

---

## 8. Possibili Estensioni Future

- Integrazione con sistemi di identità digitale;
- Deploy su rete pubblica;
- Miglioramento della scalabilità tramite Layer 2.

---

## 9. Installazione e Setup del Progetto

### 9.1 Prerequisiti

Assicurarsi di avere installato:
- Node.js (versione LTS consigliata)
- npm 
- MetaMask (estensione browser)
- Git

---

### 9.2 Clonazione del Repository

```bash
git clone <URL_DEL_REPOSITORY>
cd <NOME_PROGETTO>