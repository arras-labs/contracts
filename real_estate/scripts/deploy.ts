import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Inizio deployment del contratto RealEstate...");

  // Deploy del contratto
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();

  await realEstate.waitForDeployment();
  const contractAddress = await realEstate.getAddress();

  console.log("✅ Contratto RealEstate deployato a:", contractAddress);

  // Aggiungi alcune proprietà di esempio
  console.log("\n📋 Aggiunta proprietà di esempio...");

  // NOTA: I prezzi ora sono in USD (numeri interi), non più in ETH!
  // Ogni token vale $50, quindi il valore totale deve essere multiplo di 50
  const properties = [
    {
      name: "Villa Moderna con Piscina",
      description:
        "Splendida villa moderna con piscina, giardino e vista mare. 4 camere da letto, 3 bagni.",
      location: "Milano, Lombardia",
      totalValueUSD: 500000, // $500,000 = 10,000 token
      area: 350,
      imageUrl:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800",
    },
    {
      name: "Appartamento Centro Storico",
      description:
        "Elegante appartamento ristrutturato nel cuore del centro storico. 2 camere, 1 bagno.",
      location: "Roma, Lazio",
      totalValueUSD: 250000, // $250,000 = 5,000 token
      area: 120,
      imageUrl:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
    },
    {
      name: "Attico di Lusso",
      description:
        "Attico di lusso con terrazza panoramica di 200mq. 3 camere, 2 bagni, doppio garage.",
      location: "Firenze, Toscana",
      totalValueUSD: 750000, // $750,000 = 15,000 token
      area: 280,
      imageUrl:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
    },
    {
      name: "Casale in Campagna",
      description:
        "Casale rustico completamente ristrutturato con terreno di 5000mq. 5 camere, 3 bagni.",
      location: "Siena, Toscana",
      totalValueUSD: 350000, // $350,000 = 7,000 token
      area: 400,
      imageUrl:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
    },
    {
      name: "Loft Design",
      description:
        "Loft in zona industriale riconvertita, design moderno e minimalista. Open space, 1 bagno.",
      location: "Torino, Piemonte",
      totalValueUSD: 180000, // $180,000 = 3,600 token
      area: 180,
      imageUrl:
        "https://images.unsplash.com/photo-1502672260066-6bc35f0b3764?w=800",
    },
  ];

  for (const property of properties) {
    const tx = await realEstate.listProperty(
      property.name,
      property.description,
      property.location,
      property.totalValueUSD,
      property.area,
      property.imageUrl
    );
    await tx.wait();
    const tokens = Math.floor(property.totalValueUSD / 50);
    console.log(
      `✅ Aggiunta: ${
        property.name
      } - $${property.totalValueUSD.toLocaleString()} (${tokens} token)`
    );
  }

  console.log("\n🎉 Setup completato!");
  console.log("📝 Salva questo indirizzo nel file .env del frontend:");
  console.log(`VITE_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
