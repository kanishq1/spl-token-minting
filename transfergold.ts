import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SplTokenMinter } from "../target/types/spl_token_minter";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Metaplex } from "@metaplex-foundation/js";
import { assert } from "chai";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  getAccount
} from "@solana/spl-token";
import { WalletConfigError } from "@solana/wallet-adapter-base";

describe("Transfer Tokens", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const dataAccount = anchor.web3.Keypair.generate();
  const mintKeypair = anchor.web3.Keypair.generate();
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  const program = anchor.workspace.SplTokenMinter as Program<SplTokenMinter>;

  const tokenTitle = "Kingmans";
  const tokenSymbol = "KING";
  const tokenUri =
    "https://res.cloudinary.com/ddwkxn8ak/image/upload/v1698823073/solangsol/Course1_mhz1c1.png";

  let tokenAccount;
  let recepienttokenAmount;


  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods
      .new()
      .accounts({ dataAccount: dataAccount.publicKey })
      .signers([dataAccount])
      .rpc();
    console.log("Your transaction signature", tx);
  });

  it("Create an SPL Token!", async () => {
    const metaplex = Metaplex.make(connection);
    const metadataAddress = await metaplex
      .nfts()
      .pdas()
      .metadata({ mint: mintKeypair.publicKey });

    // Add your test here.
    const tx = await program.methods
      .createTokenMint(
        wallet.publicKey, // freeze authority
        9, // 0 decimals for NFT
        tokenTitle, // NFT name
        tokenSymbol, // NFT symbol
        tokenUri // NFT URI
      )
      .accounts({
        payer: wallet.publicKey,
        mint: mintKeypair.publicKey,
        metadata: metadataAddress,
        mintAuthority: wallet.publicKey,
        rentAddress: SYSVAR_RENT_PUBKEY,
        metadataProgramId: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
      })
      .signers([mintKeypair])
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);
  });


  it("Mint some tokens to your wallet!", async () => {
    // Wallet's associated token account address for mint
    console.log("wallet",wallet)
    tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint
      wallet.publicKey // owner
    );

    console.log("associated token account:", tokenAccount)

    const tx = await program.methods
      .mintTo(
        new anchor.BN(150) // amount to mint
      )
      .accounts({
        mintAuthority: wallet.publicKey,
        tokenAccount: tokenAccount.address,
        mint: mintKeypair.publicKey,
      })
      .rpc({ skipPreflight: true });
    console.log("Your transaction signature", tx);

    // console.log("Your transaction signature", tx);
     recepienttokenAmount = (await getAccount(connection, tokenAccount.address)).amount;
    console.log("recipienttokenAmount", recepienttokenAmount);
    let tokens = Number(recepienttokenAmount);
    console.log("tkens", tokens)
  });



async function getRecipientTokenAmount() {
  // Assuming getAccount and receipientTokenAccount are defined elsewhere
  const recipientTokenAccount = await getAccount(connection, recepienttokenAmount.address);
  const amount = recipientTokenAccount.amount;
  return amount;
}

// (async () => {
//   try {
//     const amount = await getRecipientTokenAmount();
//     console.log("Recipient token amount:", amount);
//     let tokens = Number(amount);
//     assert.equal(tokens / LAMPORTS_PER_SOL, 54);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

  // const recepienttokenAmount = await getAccount(connection, receipientTokenAccount.address).amount;
  // console.log("recipienttokenAmount", recepienttokenAmount);
  // let tokens = Number(recepienttokenAmount);
  // assert.equal(tokens / LAMPORTS_PER_SOL, 54);

  it("Transfer some tokens to another wallet!", async () => {

    const receipient = anchor.web3.Keypair.generate();
    const receipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet.payer, // payer
      mintKeypair.publicKey, // mint account
      receipient.publicKey // owner account
    );

    const tx = await program.methods
      .transferTokens(
        new anchor.BN(50)
      )
      .accounts({
        from: tokenAccount.address,
        to: receipientTokenAccount.address,
        owner: wallet.publicKey,
      })
      .rpc();
    console.log("Your transaction signature", tx);
    const recepienttokenAmount = (await getAccount(connection, receipientTokenAccount.address)).amount;
    console.log("recipienttokenAmount", recepienttokenAmount);
    let tokens = Number(recepienttokenAmount);
    console.log("reciepenmt token:", tokens);


    const bachehuetoken = (await getAccount(connection, tokenAccount.address)).amount;
    console.log("bachehuetoken", bachehuetoken);
    let tokensss = Number(bachehuetoken);
    console.log("tkens", tokensss)
  });

});