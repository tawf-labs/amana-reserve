import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { expect } from "chai";

describe("amana-hai with VRF integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AmanaHai as Program;
  
  let haiPda: PublicKey;
  const activityId = Array.from(Buffer.alloc(32, 2));

  before(async () => {
    [haiPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("hai")],
      program.programId
    );
  });

  it("Initializes HAI tracker", async () => {
    await program.methods
      .initialize(8500) // 85% initial score
      .accounts({
        hai: haiPda,
        admin: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const hai = await program.account.hai.fetch(haiPda);
    expect(hai.currentScore).to.equal(8500);
  });

  it("Updates HAI score with VRF", async () => {
    const dataSources = [1, 2, 3, 4, 5]; // Mock data sources

    const tx = await program.methods
      .updateHaiScoreWithVrf(activityId, dataSources)
      .accounts({
        hai: haiPda,
        payer: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ HAI score updated with VRF:", tx);
    
    const hai = await program.account.hai.fetch(haiPda);
    console.log("New HAI score:", hai.currentScore);
  });

  it("Updates HAI in real-time on ER", async () => {
    const erProvider = new anchor.AnchorProvider(
      new anchor.web3.Connection("https://devnet-as.magicblock.app/"),
      provider.wallet,
      { commitment: "confirmed" }
    );

    const erProgram = new Program(
      program.idl,
      program.programId,
      erProvider
    );

    const tx = await erProgram.methods
      .updateHaiRealtime(activityId, 100) // +1% compliance boost
      .accounts({
        hai: haiPda,
        payer: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ HAI updated in real-time on ER:", tx);
  });

  it("Commits HAI scores from ER to base layer", async () => {
    const magicContext = Keypair.generate().publicKey; // Mock
    const magicProgram = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

    const tx = await program.methods
      .commitHaiScores()
      .accounts({
        hai: haiPda,
        payer: provider.wallet.publicKey,
        magicContext,
        magicProgram,
      })
      .rpc();

    console.log("✅ HAI scores committed to base layer:", tx);
  });
});
