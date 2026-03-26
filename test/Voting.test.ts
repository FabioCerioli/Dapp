import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Voting Contract", function () {
  
  // Questa funzione fa il setup iniziale (Deploy) prima di ogni test
  async function deployVotingFixture() {
    // Prendiamo 3 account finti: deployer (admin), addr1 (votante 1), addr2 (votante 2)
    const [owner, voter1, voter2] = await ethers.getSigners();

    const Voting = await ethers.getContractFactory("Voting");
    // Deployamo con 3 candidati
    const voting = await Voting.deploy(["Mario Rossi", "Luca Bianchi", "Giulia Verdi"]);

    return { voting, owner, voter1, voter2 };
  }

  // TEST 1: Controlliamo se il deploy funziona
  it("Dovrebbe avere 3 candidati iniziali", async function () {
    const { voting } = await loadFixture(deployVotingFixture);
    const candidates = await voting.getAllCandidates();
    
    expect(candidates.length).to.equal(3);
    expect(candidates[0].name).to.equal("Mario Rossi");
  });

  // TEST 2: Controlliamo se si può votare
  it("Dovrebbe permettere a un utente di votare e incrementare il conteggio", async function () {
    const { voting, voter1 } = await loadFixture(deployVotingFixture);

    // Voter1 vota per il candidato 0 (Mario Rossi)
    // .connect(voter1) significa "fai finta di essere voter1"
    await voting.connect(voter1).vote(0);

    const candidates = await voting.getAllCandidates();
    expect(candidates[0].voteCount).to.equal(1); // Ora deve avere 1 voto
  });

  // TEST 3: Controlliamo la sicurezza (Niente doppi voti)
  it("Dovrebbe impedire il doppio voto", async function () {
    const { voting, voter1 } = await loadFixture(deployVotingFixture);

    // Voter1 vota la prima volta... tutto ok
    await voting.connect(voter1).vote(0);

    // Voter1 ci riprova... deve fallire!
    // Ci aspettiamo che la transazione venga rifiutata ("reverted")
    await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Hai gia' votato!");
  });

  // TEST 4: Controlliamo input non validi
  it("Non dovrebbe permettere di votare candidati inesistenti", async function () {
    const { voting, voter1 } = await loadFixture(deployVotingFixture);

    // Provo a votare il candidato numero 99 (che non esiste)
    await expect(voting.connect(voter1).vote(99)).to.be.revertedWith("Candidato non valido");
  });
});