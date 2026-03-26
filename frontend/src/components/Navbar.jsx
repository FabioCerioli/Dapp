import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const location = useLocation();

  const links = [
    { path: "/", label: "Tutte" },
    { path: "/filter", label: "Filtra" },
    { path: "/create", label: "Crea" },
    { path: "/delete", label: "Elimina" }
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">DeVote</div>
        <div className="nav-links">
          {links.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={location.pathname === link.path ? "active-link" : ""}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;