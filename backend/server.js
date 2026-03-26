// backend/server.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use("/img", express.static(path.join(__dirname, "img")));



// PATH 
const DB_FOLDER = path.join(__dirname, "db");
const DB_FILE = path.join(DB_FOLDER, "candidates.json");
const ELECTIONS_FILE = path.join(DB_FOLDER, "elections.json");

// Crea cartella e file 
if (!fs.existsSync(DB_FOLDER)) fs.mkdirSync(DB_FOLDER, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ candidates: [], requests: [] }, null, 2));
if (!fs.existsSync(ELECTIONS_FILE)) fs.writeFileSync(ELECTIONS_FILE, JSON.stringify([], null, 2));


const readDB = () => JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
const readElections = () => JSON.parse(fs.readFileSync(ELECTIONS_FILE, "utf8"));
const writeElections = (data) => fs.writeFileSync(ELECTIONS_FILE, JSON.stringify(data, null, 2));








const saveImage = (base64Data, prefix = "img") => {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.includes(";base64,")) {
    return null;
  }

  try {
    const matches = base64Data.match(/^data:image\/([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const ext = matches[1];
    const data = matches[2];
    const buffer = Buffer.from(data, "base64");

    const fileName = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(__dirname, "img", fileName);

    if (!fs.existsSync(path.join(__dirname, "img"))) {
      fs.mkdirSync(path.join(__dirname, "img"), { recursive: true });
    }

    fs.writeFileSync(filePath, buffer);
    return fileName;
  } catch (err) {
    console.error("Errore salvataggio immagine:", err);
    return null;
  }
};



// ROOT ROUTE
app.get("/", (_, res) => {
  res.send(`Backend attivo su http://localhost:${PORT}`);
});

// ELECTION
app.get("/api/elections", (_, res) => {
  res.json(readElections());
});

// Restituisce elezione tramite ID
app.get("/api/elections/:id", (req, res) => {

  const elections = readElections();

  const election = elections.find(e => e.id === req.params.id);

  if (!election) {
    return res.status(404).json({ error: "Elezione non trovata" });
  }

  res.json(election);

});

// Restituisce elezione tramite codice
app.get("/api/elections-code/:code", (req, res) => {
  const election = readElections().find(e => e.code === req.params.code);
  if (!election) return res.status(404).json({ error: "Codice elezione non valido" });
  res.json(election);
});

// Creazione nuova elezione
app.post("/api/elections", (req, res) => {
  const elections = readElections();
  let { id, title, description, image, startTime, endTime, resultsHidden, allowMultiple, creator, candidates } = req.body;

  if (elections.some(e => e.id === id)) {
    return res.status(400).json({ error: "Election ID già esistente" });
  }

  const mainImageName = saveImage(image, "election");

  const processedCandidates = candidates.map((c, index) => {
    const candidateImgName = saveImage(c.image, `cand-${index}`);
    return {
      ...c,
      image: candidateImgName 
    };
  });

  const newElection = {
    id,
    title,
    description,
    image: mainImageName, 
    startTime,
    endTime,
    resultsHidden,
    allowMultiple,
    isCancelled: false,
    candidates: processedCandidates,
    creator
  };

  elections.push(newElection);
  writeElections(elections);

  res.json({ message: "Elezione creata", election: newElection });
});

// Annulla elezione (solo creatore e prima dell'inizio)
app.post("/api/elections/:id/cancel", (req, res) => {
  const elections = readElections();
  const electionId = Number(req.params.id);
  const index = elections.findIndex(e => e.id === electionId);

  if (index === -1) return res.status(404).json({ error: "Elezione non trovata" });

  const election = elections[index];
  const now = Math.floor(Date.now() / 1000);

  if (req.body.userId !== election.creator) {
    return res.status(403).json({ error: "Non sei il creatore dell'elezione" });
  }

  if (election.isCancelled || (election.startTime && now >= election.startTime)) {
    return res.status(400).json({ error: "Non puoi cancellare un'elezione iniziata o già cancellata" });
  }

  elections[index].isCancelled = true;
  writeElections(elections);

  res.json({ message: "Elezione cancellata", election: elections[index] });
});

// CANDIDATI
// Lista candidati per elezione (con voti nascosti se elezione attiva e resultsHidden)
app.get("/api/candidates/:electionId/safe", (req, res) => {
  const electionId = Number(req.params.electionId);
  const elections = readElections();
  const db = readDB();

  const election = elections.find(e => e.id === electionId);
  if (!election) return res.status(404).json({ error: "Elezione non trovata" });

  const now = Math.floor(Date.now() / 1000);
  const isActive = !election.isCancelled && (!election.startTime || now >= election.startTime) && (!election.endTime || now <= election.endTime);
  const hideVotes = election.resultsHidden && isActive;

  const candidates = db.candidates
    .filter(c => c.electionId === electionId)
    .map(c => ({
      id: c.id,
      name: c.name,
      voteCount: hideVotes ? 0 : c.voteCount
    }));

  res.json(candidates);
});

// Aggiunge candidato (solo creatore e prima dell'inizio)
app.post("/api/candidates/:electionId", (req, res) => {
  const electionId = req.params.electionId; 
  const elections = readElections();
  const db = readDB();

  const index = elections.findIndex(e => e.id === electionId);
  if (index === -1) return res.status(404).json({ error: "Elezione non trovata" });

  const election = elections[index];
  const now = Math.floor(Date.now() / 1000);

  if (req.body.userId !== election.creator) {
    return res.status(403).json({ error: "Non sei il creatore dell'elezione" });
  }

  if (election.isCancelled || (election.startTime && now >= election.startTime)) {
    return res.status(400).json({ error: "Non puoi aggiungere candidati a un'elezione iniziata o cancellata" });
  }

  const newCandidateId = req.body.id || require("uuid").v4();

  const newCandidate = {
    id: newCandidateId,
    electionId,
    name: req.body.name,
    description: req.body.description || "",
    image: req.body.image || "",
    voteCount: 0
  };

  db.candidates.push(newCandidate);
  writeDB(db);

  res.json({ message: "Candidato aggiunto", candidate: newCandidate });
});


// Voto per candidato
app.post("/api/candidates/:electionId/vote/:candidateId", (req, res) => {
  const electionId = Number(req.params.electionId);
  const candidateId = Number(req.params.candidateId);
  const elections = readElections();
  const db = readDB();

  const election = elections.find(e => e.id === electionId);
  if (!election) return res.status(404).json({ error: "Elezione non trovata" });

  const candidate = db.candidates.find(c => c.id === candidateId && c.electionId === electionId);
  if (!candidate) return res.status(404).json({ error: "Candidato non trovato" });

  const now = Math.floor(Date.now() / 1000);
  if (election.isCancelled || (election.startTime && now < election.startTime) || (election.endTime && now > election.endTime)) {
    return res.status(400).json({ error: "Elezione non attiva" });
  }

  // Controllo voti multipli
  if (!election.allowMultiple) {
    if (db.requests.some(v => v.electionId === electionId && v.userId === req.body.userId)) {
      return res.status(400).json({ error: "Hai già votato" });
    }
  } else {
    if (db.requests.some(v => v.electionId === electionId && v.userId === req.body.userId && v.candidateId === candidateId)) {
      return res.status(400).json({ error: "Hai già votato questo candidato" });
    }
  }

  candidate.voteCount += 1;
  db.requests.push({ electionId, candidateId, userId: req.body.userId });
  writeDB(db);

  res.json({ message: "Voto registrato", candidate });
});



// SERVER START
app.listen(PORT, () => {
  console.log(`Backend attivo su http://localhost:${PORT}`);
});