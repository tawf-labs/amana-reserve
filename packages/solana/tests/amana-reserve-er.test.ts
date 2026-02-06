// Copyright 2026 TAWF Labs
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("amana-reserve with MagicBlock ER", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AmanaReserve as Program;
  
  // MagicBlock ER Validator (Devnet Asia)
  const ER_VALIDATOR = new PublicKey("MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57");
  
  let reservePda: PublicKey;
  let participantPda: PublicKey;
  let activityPda: PublicKey;
  
  const activityId = Array.from(Buffer.alloc(32, 1));

  before(async () => {
    [reservePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("reserve")],
      program.programId
    );
    
    [participantPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("participant"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    
    [activityPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("activity"), Buffer.from(activityId)],
      program.programId
    );
  });

  it("Initializes the reserve", async () => {
    await program.methods
      .initialize(
        new anchor.BN(1_000_000_000), // 1 SOL minimum
        new anchor.BN(100) // Max 100 participants
      )
      .accounts({
        reserve: reservePda,
        admin: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const reserve = await program.account.reserve.fetch(reservePda);
    expect(reserve.isInitialized).to.be.true;
    expect(reserve.minCapitalContribution.toNumber()).to.equal(1_000_000_000);
  });

  it("Joins the reserve", async () => {
    await program.methods
      .joinReserve(new anchor.BN(2_000_000_000)) // 2 SOL
      .accounts({
        reserve: reservePda,
        participant: participantPda,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const participant = await program.account.participant.fetch(participantPda);
    expect(participant.capitalContributed.toNumber()).to.equal(2_000_000_000);
    expect(participant.isActive).to.be.true;
  });

  it("Delegates reserve to Ephemeral Rollup", async () => {
    const tx = await program.methods
      .delegateReserve()
      .accounts({
        payer: provider.wallet.publicKey,
        validator: ER_VALIDATOR,
        reserve: reservePda,
      })
      .rpc();

    console.log("✅ Reserve delegated to ER:", tx);
  });

  it("Proposes activity", async () => {
    await program.methods
      .proposeActivity(activityId, new anchor.BN(1_000_000_000))
      .accounts({
        reserve: reservePda,
        participant: participantPda,
        activity: activityPda,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const activity = await program.account.activity.fetch(activityPda);
    expect(activity.capitalRequired.toNumber()).to.equal(1_000_000_000);
  });

  it("Deploys capital in real-time on ER", async () => {
    // This would run on ER connection
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

    const magicContext = Keypair.generate().publicKey; // Mock
    const magicProgram = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

    const tx = await erProgram.methods
      .deployCapitalRealtime(activityId, new anchor.BN(500_000_000))
      .accounts({
        reserve: reservePda,
        activity: activityPda,
        payer: provider.wallet.publicKey,
        magicContext,
        magicProgram,
      })
      .rpc();

    console.log("✅ Capital deployed on ER:", tx);
  });

  it("Commits and undelegates reserve", async () => {
    const magicContext = Keypair.generate().publicKey; // Mock
    const magicProgram = new PublicKey("DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh");

    const tx = await program.methods
      .commitAndUndelegateReserve()
      .accounts({
        reserve: reservePda,
        payer: provider.wallet.publicKey,
        magicContext,
        magicProgram,
      })
      .rpc();

    console.log("✅ Reserve committed and undelegated:", tx);
  });
});
