import { useState } from "react";
import ElectionList from "./ElectionList";

function FilterPage() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");

  const statusMap = {
    "": null,
    "In Arrivo": 0,
    "Attiva": 1,
    "Terminata": 2,
    "Annullata": 3
  };

  return (
    <div className="container">
      <div className="card form-card">
        <h2 className="card-title">Filtra Elezioni</h2>

        <div className="filter-container-group">
          <div className="form-group form-group-item">
            <label>Codice Elezione</label>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Inserisci codice" />
          </div>

          <div className="form-group form-group-item">
            <label>Nome Elezione</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Inserisci nome" />
          </div>
          
          <div className="form-group form-group-item">
            <label>Stato</label>

            <div className="status-filter-group">
              {[
                { label: "Tutti", value: "" },
                { label: "In Arrivo", value: "In Arrivo", class: "badge-pending" },
                { label: "Attiva", value: "Attiva", class: "badge-active" },
                { label: "Terminata", value: "Terminata", class: "badge-ended" },
                { label: "Annullata", value: "Annullata", class: "badge-cancelled" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`status-filter-btn 
                    ${option.class || "badge-neutral"} 
                    ${status === option.value ? "selected-filter" : ""}`}
                  onClick={() => setStatus(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lista Elezioni filtrata */}
      <ElectionList
        filterCode={code}
        filterStatus={statusMap[status]}
        filterName={name}
      />
    </div>
  );
}

export default FilterPage;