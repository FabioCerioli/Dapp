import { useState } from "react";
import { ethers } from "ethers";
import contractABI from "../abi/Voting.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function CreateElectionPage() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null); 
  const [imagePreview, setImagePreview] = useState(null);
  const [candidates, setCandidates] = useState([
    { id: 0, name: "", image: "", description: "", party: "" }
  ]);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [allowMultiple, setAllowMultiple] = useState(false);
  const [resultsHidden, setResultsHidden] = useState(true);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorDetails, setErrorDetails] = useState("");



    /* ---------------- CANDIDATI ---------------- */

    const addCandidate = () => {
      setCandidates([
        ...candidates,
        { id: candidates.length, name: "", image: "", description: "", party: "" }
      ]);
    };

    const updateCandidate = (index, field, value) => {
      const updated = [...candidates];
      updated[index][field] = value;
      setCandidates(updated);
    };

    const removeCandidate = (index) => {
      const updated = candidates.filter((_, i) => i !== index);
      setCandidates(updated.map((c, idx) => ({ ...c, id: idx })));
    };

    /* ---------------- SUBMIT ---------------- */
  async function handleSubmit(e) {
    e.preventDefault();

    if (candidates.length < 2) {
      setMessage("⚠️ Inserisci almeno 2 candidati");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorDetails("");

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

      const startTimestamp = Math.floor(new Date(startTime).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(endTime).getTime() / 1000);

      const candidateNames = candidates.map(c => c.name);

      const electionIdInput = `${title}-${Date.now()}`;

      const tx = await contract.createElection(
        electionIdInput,
        title,
        candidateNames,
        resultsHidden,
        allowMultiple
      );
    const receipt = await tx.wait();
    console.log("Receipt logs:", receipt.logs);

    const events = await contract.queryFilter(
      contract.filters.ElectionCreated(), 
      receipt.blockNumber,
      receipt.blockNumber
    );

    if (events.length === 0) {
    } else {
      const blockchainId = events[0].args.electionId.toString();

      // BACKEND 
      const payload = {
          id: blockchainId,
          title,
          description,
          image: imagePreview, 
          startTime: startTimestamp,
          endTime: endTimestamp,
          resultsHidden,
          allowMultiple,
          candidates 
      };

      await fetch("http://localhost:3000/api/elections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
      });

      setMessage("Elezione creata con successo!");
    }
    } catch (err) {
      console.error(err);
      setMessage("Errore durante la creazione");
      setErrorDetails(err.reason || err.message || JSON.stringify(err));
    }

    setLoading(false);
  }
  const handleCandidateImage = (index, file) => {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const updated = [...candidates];
    updated[index].image = reader.result; 
    setCandidates(updated);
  };
  reader.readAsDataURL(file);
};
  return (
    <div className="container">

      <div className="card form-card">

        <h2 className="card-title">🗳️ Crea nuova elezione</h2>

        <form onSubmit={handleSubmit}>

          <h3 className="section-title">Informazioni elezione</h3>

          <div className="form-group">
            <label>Nome elezione</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Descrizione</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Immagine elezione</label>

            <input
              type="file"
              accept="image/*"
              className="file-input"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0];
                  setImage(file);

                  const reader = new FileReader();
                  reader.onload = () => {
                    setImagePreview(reader.result);
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />

            {imagePreview && (
              <img
                src={imagePreview}
                alt="preview"
                style={{ marginTop: 10, maxHeight: 120, borderRadius: 8 }}
              />
            )}
          </div>


          <h3 className="section-title">Date</h3>

          <div className="filter-container-group">

            <div className="form-group">
              <label>Data inizio</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Data fine</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
              />
            </div>

          </div>

          {/* --------- CANDIDATI --------- */}

          <h3 className="section-title">Candidati</h3>

          <div className="candidates-grid">

            {candidates.map((c, idx) => (

              <div key={c.id} className="candidate-card">

                <input
                  placeholder="Nome candidato"
                  value={c.name}
                  onChange={e => updateCandidate(idx, "name", e.target.value)}
                  required
                />

                <input
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={e => handleCandidateImage(idx, e.target.files[0])}
                />

                <input
                  placeholder="Partito"
                  value={c.party}
                  onChange={e => updateCandidate(idx, "party", e.target.value)}
                />

                <textarea
                  placeholder="Descrizione"
                  value={c.description}
                  onChange={e => updateCandidate(idx, "description", e.target.value)}
                />


                {candidates.length > 1 && (
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeCandidate(idx)}
                  >
                    Rimuovi
                  </button>
                )}

              </div>

            ))}

          </div>

          <button
            type="button"
            className="back-btn"
            onClick={addCandidate}
          >
            ➕ Aggiungi candidato
          </button>

          {/* --------- OPZIONI --------- */}

          <h3 className="section-title">Impostazioni</h3>
          <div className="settings-group">

            <div className="setting-row">
              <div className="setting-text">
                <strong>Voto multiplo</strong>
                <span>Gli utenti possono votare più candidati</span>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={() => setAllowMultiple(!allowMultiple)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-text">
                <strong>Risultati nascosti</strong>
                <span>I risultati saranno visibili solo alla fine</span>
              </div>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={resultsHidden}
                  onChange={() => setResultsHidden(!resultsHidden)}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

          </div>

          {/* --------- SUBMIT --------- */}

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Creazione..." : "Crea elezione"}
          </button>

          {message && (
            <div className="submit-message">
              {message}
            </div>
          )}

          {errorDetails && (
            <div className="error-message">
              ⚠️ {errorDetails}
            </div>
          )}

        </form>

      </div>

    </div>
  );
}

export default CreateElectionPage;