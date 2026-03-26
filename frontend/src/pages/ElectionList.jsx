import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "../abi/Voting.json";
import { useNavigate } from "react-router-dom";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function ElectionList({ filterCode = "", filterStatus = null, filterName = "" }) {
  const navigate = useNavigate(); 
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadElections();
  }, []);

async function loadElections() {
  try {
    if (!window.ethereum) {
      setError("Installa MetaMask per continuare");
      setLoading(false);
      return;
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, provider);

    let backendData = [];
    try {
      const res = await fetch("http://localhost:3000/api/elections");
      if (res.ok) {
        backendData = await res.json();
      }
    } catch (err) {
      console.error("Errore fetch backend:", err);
    }

    const ids = await contract.getAllElectionIds();
    const loaded = [];
  for (let id of ids) {
      try {
        const idNum = Number(id);
        const e = await contract.getElection(idNum);

        const bInfo = backendData.find(item => Number(item.id) === idNum) || {};

        const now = Math.floor(Date.now() / 1000); 
        const start = Number(bInfo.startTime) || 0;
        const end = Number(bInfo.endTime) || 0;

        let statusNum;

        if (e.isCancelled) {
          statusNum = 3; 
        } else if (start > 0 && now < start) {
          statusNum = 0; 
        } else if (end > 0 && now > end) {
          statusNum = 2; 
        } else {
          statusNum = 1; 
        }

        loaded.push({
          id: idNum,
          title: e.title,
          candidates: e.candidates.map(c => ({
            name: c.name,
            voteCount: Number(c.voteCount)
          })),
          resultsHidden: e.resultsHidden,
          allowMultiple: e.allowMultiple,
          status: statusNum, 
          code: e.code,
          isCancelled: e.isCancelled,
          mainImage: bInfo.image || null,
          startTime: start, 
          endTime: end,
          description: bInfo.description || ""
        });

      } catch (err) {
        console.warn(`Elezione con ID ${id} non trovata:`, err);
      }
    }

    setElections(loaded);
    setLoading(false);

  } catch (err) {
    console.error(err);
    setError("Errore caricamento elezioni");
    setLoading(false);
  }
}

  function renderStatus(status) {
    switch (status) {
      case 0: return "In Arrivo";
      case 1: return "Attiva";
      case 2: return "Terminata";
      case 3: return "Annullata";
      default: return "Sconosciuto";
    }
  }

  const filtered = elections.filter(e => {
    if (filterCode && !e.code.includes(filterCode.toUpperCase())) return false;
    if (filterStatus !== null && e.status !== filterStatus) return false;
    if (filterName && !e.title.toLowerCase().includes(filterName.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="container">
      <div className="home-header">
        <h1 className="home-title">Elezioni Disponibili</h1>
        <p className="home-subtitle">Sistema di voto decentralizzato</p>
      </div>

      {loading && <div className="loading-container">Caricamento elezioni...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="candidates-grid">
        {!loading && filtered.map(e => {
          const borderClass =
            e.status === 1 ? "border-active" :
            e.status === 2 ? "border-ended" :
            e.status === 3 ? "border-cancelled" :
            "border-pending";

          const badgeClass =
            e.status === 1 ? "badge-active" :
            e.status === 2 ? "badge-ended" :
            e.status === 3 ? "badge-cancelled" :
            "badge-pending";

          return (
              <div
                key={e.id}
                className={`card ${borderClass}`}
                onClick={() => navigate(`/election/${e.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="avatar" style={{ overflow: "hidden" }}>
                  {e.mainImage ? (
                    <img 
                      src={`http://localhost:3000/img/${e.mainImage}`} 
                      alt={e.title} 
                      style={{ 
                        width: "95%", 
                        height: "95%", 
                        objectFit: "cover",
                        borderRadius: "50%" 
                      }}
                      onError={(evt) => {
                        evt.target.style.display = 'none';
                        evt.target.parentNode.style.background = "linear-gradient(135deg, #1e293b, #0f172a)";
                        evt.target.parentNode.innerHTML = '<span style="font-size: 3rem;">🗳️</span>';
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "3rem" }}>🗳️</span>
                  )}
                </div>

                <h3 className="card-title">{e.title}</h3>
                <p className="card-subtitle">Codice: {e.code}</p>

                <div className={`status-badge ${badgeClass}`}>
                  {renderStatus(e.status)}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}

export default ElectionList;