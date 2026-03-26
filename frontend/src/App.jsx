import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ElectionList from "./pages/ElectionList";
import FilterPage from "./pages/FilterPage";
import CreateElectionPage from "./pages/CreateElectionPage";
import DeleteElectionPage from "./pages/DeleteElectionPage";
import ElectionDetailsPage from "./pages/ElectionDetailsPage";
import "./App.css";

function App() {
  return (
    <div className="app-content">
      <Navbar />

      <Routes>
        <Route path="/" element={<ElectionList />} />
        <Route path="/filter" element={<FilterPage />} />
        <Route path="/create" element={<CreateElectionPage />} />
        <Route path="/delete" element={<DeleteElectionPage />} />
        <Route path="/election/:id" element={<ElectionDetailsPage />} />
      </Routes>
    </div>
  );
}

export default App;