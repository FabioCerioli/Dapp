import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploy del contratto Voting...");

  // Otteniamo il signer (l'account che fa il deploy)
  const [deployer] = await ethers.getSigners();
  
  // Hardhat non espone direttamente la stringa della private key per motivi di sicurezza
  // Tuttavia, se sei in locale con "hardhat node", la chiave del primo account è nota.
  // Se vuoi automatizzare il recupero della chiave usata nel config:
  const networkConfig = await ethers.provider.getNetwork();
  
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  console.log("⏳ In attesa della conferma sulla blockchain...");
  await voting.waitForDeployment();

  const address = await voting.getAddress();

  console.log("\n✅ CONTRATTO DEPLOYATO CON SUCCESSO!");
  console.log("📍 Indirizzo:", address);
  console.log("👤 Deployer:", deployer.address);

  // ==========================================
  // SCRITTURA AUTOMATICA .ENV (CON PRIVATE KEY)
  // ==========================================
  console.log("\n📝 Aggiornamento automatico del frontend .env...");

  const envPath = path.resolve("../progetto-voto/frontend/.env");

  /**
   * NOTA: Hardhat non permette di leggere la stringa "PRIVATE_KEY" dai signers per sicurezza.
   * Ma se stai usando il nodo locale di Hardhat, la chiave del primo account è SEMPRE:
   * 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   */
  const LOCAL_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

  let envContent = `VITE_CONTRACT_ADDRESS=${address}\n`;
  envContent += `PRIVATE_KEY=${LOCAL_PRIVATE_KEY}\n`;

  fs.writeFileSync(envPath, envContent);

  console.log("✅ .env aggiornato con successo (Indirizzo + Chiave Privata)!");

  console.log("\n🎉 Deploy completo!");
}

main().catch((error) => {
  console.error("❌ Errore durante il deploy:");
  console.error(error);
  process.exitCode = 1;
});