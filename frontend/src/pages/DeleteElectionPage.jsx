import { useState, useEffect } from "react";
import { ethers } from "ethers";
import contractABI from "../abi/Voting.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

function DeleteElectionPage() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    loadMyElections();
  }, []);

  async function loadMyElections() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

      const myAddress = await signer.getAddress();
      const count = Number(await contract.getElectionCount());

      const list = [];
      for (let i = 0; i < count; i++) {
        const raw = await contract.getElection(i); 
        const meta = await contract.getElectionMeta(i);

        const electionId = raw[4]?.toString(); 

        if (!electionId) {
          console.warn("Elezione senza ID:", raw);
          continue;
        }

        if (meta.creator.toLowerCase() === myAddress.toLowerCase()) {
          list.push({
            id: i.toString(), 
            blockchainId: raw[4]?.toString(),
            title: raw[0],
            candidates: raw[1].map(c => ({ name: c.name, voteCount: Number(c.voteCount) })),
            resultsHidden: raw[2],
            allowMultiple: raw[3],
            code: raw[5],
            isCancelled: raw[6]
          });
        }
      }

      setElections(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function handleDelete(election) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, signer);

      setErrors(prev => ({ ...prev, [election.id]: null }));

      const tx = await contract.deleteElection(election.id);
      await tx.wait();

      loadMyElections();
    } catch (err) {
      console.error("Errore completo:", err);

      let message = "Transazione fallita";

      if (err.shortMessage) message = err.shortMessage;
      if (err.info?.error?.reason) message = err.info.error.reason;
      if (err.reason) message = err.reason;

      if (message.includes("Gia' iniziata")) message = "L'elezione è già iniziata e non può essere eliminata.";
      if (message.includes("Gia' annullata")) message = "Questa elezione è già stata annullata.";
      if (message.includes("Non sei il creatore")) message = "Non sei il creatore di questa elezione.";

      if (election.isCancelled) {
        setErrors(prev => ({ ...prev, [election.id]: "Elezione già annullata." }));
        return;
      }

      if (election.status !== 0) { 
        setErrors(prev => ({ ...prev, [election.id]: "Puoi eliminare solo elezioni non ancora iniziate." }));
        return;
      }
    }
  }

  return (
    <div className="container">
      <h2 className="home-title">Le Mie Elezioni</h2>

      {loading && <div className="loading-container">Caricamento...</div>}

      <div className="candidates-grid">
       {!loading && elections.map(e => (
            <div
              key={e.id}
              className={`card ${e.isCancelled ? "border-pending" : "border-ended"}`}
              style={e.isCancelled ? { opacity: 0.6 } : {}}
            >
              <div className="avatar">
                {e.isCancelled ? "❌" : "🗑️"}
              </div>

              <h3 className="card-title">{e.title}</h3>
              <p className="card-subtitle">Codice: {e.code}</p>

              {e.isCancelled ? (
                  <div className="status-badge badge-pending">
                    Eliminata
                  </div>
                ) : (
                  <>
                    <button
                      className="primary-btn"
                      onClick={() => handleDelete(e)}
                    >
                      Elimina
                    </button>

                    {errors[e.id] && (
                      <div className="error-message" style={{ marginTop: "10px" }}>
                        {errors[e.id]}
                      </div>
                    )}
                  </>
                )}
            </div>
          ))}
      </div>
    </div>
  );
}

export default DeleteElectionPage;