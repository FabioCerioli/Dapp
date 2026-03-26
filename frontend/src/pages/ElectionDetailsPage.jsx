import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import "./ElectionDetailsPage.css"
import contractABI from "../abi/Voting.json";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

function ElectionDetailsPage() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [txError, setTxError] = useState("");

  useEffect(() => {
    loadElection();
  }, []);



      const chartData = {
        labels: election?.candidates.map(c => c.name) || [],
        datasets: [
          {
            label: '# di Voti',
            data: election?.candidates.map(c => c.voteCount) || [],
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };

      const barOptions = {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Riepilogo Voti (Istogramma)' },
        },
      };




async function loadElection() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, provider);

      // BLOCKCHAIN 
      const e = await contract.getElection(id);
      const isCancelled = e.isCancelled;
      let statusNum = Number(e.status);
      if (isCancelled) statusNum = 3;

      // BACKEND
      let backendElection = {
        description: "Nessuna descrizione disponibile.",
        image: null,
        startTime: null,
        endTime: null,
        candidates: []
      };

      try {
        const res = await fetch(`http://localhost:3000/api/elections/${id}`);
        if (res.ok) {
          backendElection = await res.json();
        }
      } catch (fetchErr) {
        console.error("Errore backend:", fetchErr);
      }

      /* ---------------- MERGE DATI ---------------- */
      setElection({
        id: id,
        title: e.title,
        candidates: e.candidates.map((c, index) => ({
          name: c.name,
          voteCount: Number(c.voteCount),
          image: backendElection.candidates?.[index]?.image || null,
          party: backendElection.candidates?.[index]?.party || "",
          description: backendElection.candidates?.[index]?.description || ""
        })),
        resultsHidden: e.resultsHidden,
        allowMultiple: e.allowMultiple,
        status: statusNum,
        code: e.code,
        isCancelled,
        description: backendElection.description,
        mainImage: backendElection.image,
        startTime: backendElection.startTime,
        endTime: backendElection.endTime
      });

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }


  function toggleCandidate(index) {
    if (!election) return;

    if (election.allowMultiple) {
      setSelected(prev =>
        prev.includes(index)
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      setSelected(prev => (prev.includes(index) ? [] : [index]));
    }
  }

  async function handleVote() {
    if (selected.length === 0) {
      setTxError("Seleziona almeno un candidato.");
      return;
    }

    try {
      setSubmitting(true);
      setTxError("");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

      if (!election.allowMultiple) {
        const tx = await contract.vote(id, selected[0]);
        await tx.wait();
      } else {
        const tx = await contract.voteMultiple(id, selected);
        await tx.wait();
      }

      setSelected([]);
      await loadElection();
    } catch (err) {
      console.error(err);
      let message = "Errore durante il voto.";

      if (err.shortMessage) message = err.shortMessage;
      if (err.info?.error?.reason) message = err.info.error.reason;
      if (err.reason) message = err.reason;

      if (message.includes("Hai gia' votato")) message = "Hai già votato in questa elezione.";
      if (message.includes("Gia' votato questo candidato")) message = "Hai già votato uno dei candidati selezionati.";
      if (message.includes("Non iniziata")) message = "L'elezione non è ancora iniziata.";
      if (message.includes("Scaduta")) message = "L'elezione è terminata.";

      setTxError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="container">Caricamento...</div>;
  if (!election) return <div className="container">Elezione non trovata</div>;

  return (
    <div className="container">
{/* 🔹 BANNER ELEZIONE CON FALLBACK */}
      <div className="election-banner" style={{ marginBottom: "20px", textAlign: "center" }}>
        {election.mainImage ? (
          <img 
            src={`http://localhost:3000/img/${election.mainImage}`} 
            alt="Banner Elezione" 
            style={{ 
              width: "100%", 
              maxHeight: "250px", 
              minHeight: "150px", 
              objectFit: "cover", 
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              display: "block"
            }} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = `
                <div style="
                  width: 100%; 
                  height: 200px; 
                  background: linear-gradient(135deg, #1e293b, #0f172a); 
                  border-radius: 12px; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  font-size: 4rem;
                  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                ">🗳️</div>`;
            }}
          />
        ) : (
          <div style={{ 
            width: "100%", 
            height: "200px", 
            background: "linear-gradient(135deg, #1e293b, #0f172a)", 
            borderRadius: "12px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            fontSize: "4rem",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
            }}>
            🗳️
          </div>
        )}
      </div>
      {/* Header */}
      <div className="home-header">
        <h1 className="home-title">{election.title}</h1>
        <p className="home-subtitle">Codice Elezione: {election.code}</p>
      </div>

      {/* Status */}
      <div
        className={`status-badge ${
          election.status === 1
            ? "badge-active"
            : election.status === 2
            ? "badge-ended"
            : election.status === 3
            ? "badge-cancelled"
            : "badge-pending"
        }`}
        style={{ marginBottom: "20px" }}
      >
        {election.status === 0 && "In Arrivo"}
        {election.status === 1 && "Attiva"}
        {election.status === 2 && "Terminata"}
        {election.status === 3 && "Annullata"}
      </div>

      <div className="card-no-flex">
        <h3 className="card-title">Informazioni Generali</h3>
        <div className="details-grid">
          {election.startTime != null && (
            <div className="detail-item">
              <strong>Data Inizio:</strong>
              <p>
                {Number(election.startTime) > 0
                  ? new Date(Number(election.startTime) * 1000).toLocaleString()
                  : "Immediata"}
              </p>
            </div>
          )}

          {election.endTime != null && (
            <div className="detail-item">
              <strong>Data Fine:</strong>
              <p>
                {Number(election.endTime) > 0
                  ? new Date(Number(election.endTime) * 1000).toLocaleString()
                  : "Illimitata"}
              </p>
            </div>
          )}

          {election.allowMultiple != null && (
            <div className="detail-item">
              <strong>Tipo di Voto:</strong>
              <p>{election.allowMultiple ? "Multiplo (più candidati)" : "Singolo (un solo voto)"}</p>
            </div>
          )}

          {election.resultsHidden != null && (
            <div className="detail-item">
              <strong>Risultati:</strong>
              <p>{election.resultsHidden ? "Nascosti durante votazione" : "Visibili in tempo reale"}</p>
            </div>
          )}

          {election.description && (
            <div className="detail-item" style={{ gridColumn: "span 3" }}>
              <strong>Descrizione:</strong>
              <p>{election.description}</p>
            </div>
          )}

        </div>
      </div>

      {/* Candidati */}
      <div className="card-no-flex" style={{ marginTop: "25px" }}>
        <h3 className="card-title">Candidati</h3>
        <div className="candidates-grid" style={{ marginTop: "15px" }}>
          {election.candidates.map((c, i) => (
            <div
              key={i}
              className={`card border-active ${selected.includes(i) ? "selected-card" : ""}`}
              onClick={() => toggleCandidate(i)}
              style={{ cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
            >
              <div className="card-image">
                {c.image ? (
                  <img 
                    className="avatar-img"
                    src={`http://localhost:3000/img/${c.image}`} 
                    alt={c.name} 
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.style.display = 'none'; 
                      e.target.parentNode.innerHTML = '<span style="font-size: 30px; display: flex; align-items: center; justify-content: center; height: 100%;">👤</span>';
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "30px", display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>👤</span>
                )}
              </div>
              <h4 className="card-title">{c.name}</h4>
              {c.party && <p className="candidate-party" style={{fontWeight: 'bold', color: '#555'}}>{c.party}</p>}
              {c.description && <p className="candidate-bio" style={{fontSize: '0.9rem'}}>{c.description}</p>}
              {election.resultsHidden && election.status === 1 ? (
                <p className="card-subtitle">Voti nascosti</p>
              ) : (
                <p className="card-subtitle">{c.voteCount} voti</p>
              )}
            </div>
          ))}
        </div>

        {/* Sezione voto */}
        {election.status === 1 && !election.isCancelled && (
          <div className="vote-section">
            {selected.length > 0 && (
              <div className="selection-info">
                Hai selezionato {selected.length} candidat{selected.length > 1 ? "i" : "o"}
              </div>
            )}

            {txError && <div className="error-message" style={{ marginBottom: "15px" }}>{txError}</div>}

            <button
              className={`vote-btn ${submitting ? "loading" : ""}`}
              onClick={handleVote}
              disabled={submitting || selected.length === 0}
            >
              {submitting ? "Transazione in corso..." : "Conferma Voto"}
            </button>
          </div>
        )}
      </div>

      {/* Warning elezione annullata */}
      {election.isCancelled && (
        <div className="error-message" style={{ marginTop: "20px" }}>
          Questa elezione è stata annullata dal creatore.
        </div>
      )}
      {/* SEZIONE STATISTICHE */}
      {(!election.resultsHidden || election.status === 2) && (
        <div className="card-no-flex" style={{ marginTop: "30px", paddingBottom: "30px" }}>
          <h3 className="card-title">Statistiche Risultati</h3>
          
          <div className="stats-container" style={{ 
            display: "flex", 
            flexWrap: "wrap", 
            justifyContent: "space-around", 
            gap: "20px",
            marginTop: "20px" 
          }}>
            
            {/* Grafico a Torta */}
            <div style={{ width: "100%", maxWidth: "350px" }}>
              <h4 style={{ textAlign: "center", marginBottom: "15px" }}>Distribuzione Percentuale</h4>
              <Pie data={chartData} options={{ responsive: true }} />
            </div>

            {/* Istogramma */}
            <div style={{ width: "100%", maxWidth: "500px" }}>
              <h4 style={{ textAlign: "center", marginBottom: "15px" }}>Voti Totali</h4>
              <Bar data={chartData} options={barOptions} />
            </div>

          </div>
          
          {/* Somma totale voti */}
          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <p><strong>Voti Totali Espressi:</strong> {election.candidates.reduce((acc, curr) => acc + curr.voteCount, 0)}</p>
          </div>
        </div>
      )}

      {/* Messaggio se i risultati sono ancora nascosti */}
      {election.resultsHidden && election.status === 1 && (
        <div className="card-no-flex" style={{ marginTop: "30px", textAlign: "center" }}>
          <p>🔒 I risultati dettagliati saranno visibili al termine della votazione.</p>
        </div>
      )}
    </div>
  );
}

export default ElectionDetailsPage;