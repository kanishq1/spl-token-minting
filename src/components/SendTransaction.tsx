import { FC, useCallback, useState } from "react";
// import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import {
    Keypair,
    SystemProgram,
    Transaction,
    TransactionMessage,
    TransactionSignature,
    VersionedTransaction,
    SYSVAR_RENT_PUBKEY,
    LAMPORTS_PER_SOL,
    Commitment,
    Connection,
    PublicKey,
} from "@solana/web3.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    getOrCreateAssociatedTokenAccount,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccount,
    getAccount,
    getMint,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import { notify } from "../utils/notifications";
import * as anchor from "@coral-xyz/anchor";
import { Program, Idl, AnchorProvider, BN, utils, web3 } from "@coral-xyz/anchor";
import { Metaplex } from "@metaplex-foundation/js";

import idl from "../../idl.json";

// import { SplTokenMinter, IDL } from "../../contracttypes"

const programId = new PublicKey(idl.metadata.address);

const opts: { preflightCommitment: Commitment } = {
    preflightCommitment: "processed",
};

// const PROGRAM_ID = new PublicKey(`HJhLRFu72TGNHUbeFoWhTPozP8EHQ4KJ3vqP7mPRD4n3`);

export const checkIfTokenAccountExists = async (connection, receiverTokenAccountAddress) => {
    // Check if the receiver's token account exists
    try {
        await getAccount(connection, receiverTokenAccountAddress, "confirmed", TOKEN_PROGRAM_ID);

        return true;
    } catch (thrownObject) {
        const error = thrownObject as Error;
        // error.message is am empty string
        // TODO: fix upstream
        if (error.name === "TokenAccountNotFoundError") {
            return false;
        }

        throw error;
    }
};

async function findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<PublicKey> {
    return (
        await PublicKey.findProgramAddress(
            [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],

            ASSOCIATED_TOKEN_PROGRAM_ID
        )
    )[0];
}

export const SendTransaction: FC = () => {
    const [tokenMint, setTokenMint] = useState<any>();
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const wallet = useWallet();

    // const connection = useConnection()

    // const provider = new anchor.AnchorProvider(connection, wallet, {});

    const getProgram = () => {
        /* create the provider and return it to the caller */

        const provider = new AnchorProvider(connection, wallet as any, opts);
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        return program;
    };

    const program = getProgram();

    // data and mint account
    const dataAccount = anchor.web3.Keypair.generate();
    const mintKeypair = anchor.web3.Keypair.generate();

    const tokenTitle = "pinkman";
    const tokenSymbol = "pinkish";
    const tokenUri = "https://res.cloudinary.com/ddwkxn8ak/image/upload/v1698823073/solangsol/Course1_mhz1c1.png";

    let tokenAccount;

    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({ type: "error", message: `Wallet not connected!` });
            console.log("error", `Send Transaction: Wallet not connected!`);
            return;
        }

        const createdataAccounttx = await program.methods
            .new()
            .accounts({ dataAccount: dataAccount.publicKey })
            .signers([dataAccount])
            .rpc();
        console.log("Your transaction signature", createdataAccounttx);
        console.log("Your transaction dataAccount", dataAccount.publicKey.toBase58());

        // creating metadata address

        const metaplex = Metaplex.make(connection);
        const metadataAddress = await metaplex.nfts().pdas().metadata({ mint: mintKeypair.publicKey });
        // create mint transaction
        try {
            const createMinttx = await program.methods
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
            console.log("Your transaction signature", createMinttx);

            let mintAccount = await getMint(connection, mintKeypair.publicKey);

            console.log("mintAccount", mintAccount.address.toBase58());

            // setTokenMint(mintKeypair.publicKey);
        } catch (error) {
            notify({ type: "error", message: `Transaction failed!`, description: error?.message });
            console.log("error", `Transaction failed! ${error?.message}`);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction]);

    const createtokenAccountandMintinWallet = useCallback(async () => {
        // if (tokenMint) {
        let mintAccount = await getMint(connection, mintKeypair.publicKey);
        console.log("mintAccount", mintAccount.address.toBase58());

        const associatedTokenAddress = getAssociatedTokenAddressSync(mintKeypair.publicKey, publicKey, false);

        console.log("ass", associatedTokenAddress);

        const transaction = new web3.Transaction().add(
            createAssociatedTokenAccountInstruction(publicKey, associatedTokenAddress, publicKey, mintKeypair.publicKey)
        );

        // transaction.feePayer(publicKey);

        transaction.feePayer = publicKey;

        let blockhash = (await connection.getLatestBlockhash("finalized")).blockhash;
        transaction.recentBlockhash = blockhash;
        wallet.signTransaction(transaction);
        console.log(`txhash: ${transaction}`, transaction);

        // console.log("")
        //    console.log("transaction",transaction)
        //  let ata = await getAssociatedTokenAddress(tokenMint, publicKey);
        //// console.log(`ATA: ${ast}`);

        //   let tx = new Transaction().add(
        //     createAssociatedTokenAccountInstruction(
        //       wallet.publicKey, // payer
        //       ata, // ata
        //       wallet.publicKey, // owner
        //       tokenMint // mint
        //     )
        //   );

        //   tx.feePayer = wallet.publicKey;
        //     let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
        //     tx.recentBlockhash = blockhash;
        //     wallet.signTransaction(tx);
        //     console.log(`txhash: ${tx}`, tx);

        // console.log(`txhash: ${await connection.sendTransaction(tx, [wallet])}`);

        //    const transfertokentx = await program.methods
        //             .mintTo(
        //                 new anchor.BN(150) // amount to mint
        //             )
        //             .accounts({
        //                 mint: tokenMint,
        //                 tokenAccount: ata,
        //                 mintAuthority: wallet.publicKey,
        //             })
        //             .rpc({ skipPreflight: true });
        //         console.log("Your transaction signature", transfertokentx);

        //    console.log("wallet",wallet)
        //  }
    }, [connection, tokenMint]);
    //    const letokenAccount = await getOrCreateAssociatedTokenAccount(
    //         connection,
    //         wallet.publicKey, // payer
    //         mintKeypair.publicKey, // mint
    //         wallet.publicKey // owner
    //       );

    // const associatedTokenAddress = await getAssociatedTokenAddress(mintKeypair.publicKey, wallet.publicKey);

    // console.log(
    //     `   Recipient Associated Token Address: ${associatedTokenAddress}`,
    // );
    // const associatedTokenAccountInfo = await connection.getAccountInfo(
    //     associatedTokenAddress,
    // );
    // if (
    //     !associatedTokenAccountInfo ||
    //     associatedTokenAccountInfo.lamports === 0
    // ) {

    //     let tx = new Transaction().add(
    //         createAssociatedTokenAccountInstruction(
    //             wallet.publicKey,
    //             associatedTokenAddress,
    //             wallet.publicKey,
    //             mintKeypair.publicKey
    //         ),
    //     );

    // tx.feePayer = wallet.publicKey;
    // let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    // tx.recentBlockhash = blockhash;
    // wallet.signTransaction(tx);
    // console.log(`txhash: ${tx}`, tx);

    //  let tokenACoount = await getAccount(connection, associatedTokenAddress);
    // console.log("tokenAmount", tokenACoount);

    // try {

    //     const isTokenAccountAlreadyMade = await checkIfTokenAccountExists(
    //         connection,
    //         associatedTokenAddress
    //       );

    //       console.log("isTokenAccountAlreadyMade",isTokenAccountAlreadyMade);

    //       if (isTokenAccountAlreadyMade) {
    //         console.log(
    //           `Token account already exists at ${associatedTokenAddress}, no need to make it`
    //         );
    //       } else {
    //         console.log(
    //           `Token account does not exist at ${associatedTokenAddress}, adding instruction to make it`
    //         );
    //         // If the account does not exist, add the create account instruction to the transaction
    //         // Logic from node_modules/@solana/spl-token/src/actions/getOrCreateAssociatedTokenAccount.ts
    //      const createFinallyata = new Transaction().add(
    //         createAssociatedTokenAccountInstruction(
    //             wallet.publicKey,
    //             associatedTokenAddress,
    //             wallet.publicKey,
    //             tokenMint,
    //             TOKEN_PROGRAM_ID,
    //             ASSOCIATED_TOKEN_PROGRAM_ID
    //           )
    //      );

    //      createFinallyata.feePayer = wallet.publicKey;
    //     let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
    //     createFinallyata.recentBlockhash = blockhash;
    //     wallet.signTransaction(createFinallyata);
    //     console.log(`txhash: ${createFinallyata}`, createFinallyata);
    //       }

    //       let tokenAccount = await getAccount(connection, associatedTokenAddress);
    //       console.log("tokenAccount",tokenAccount);
    //     // const transfertokentx = await program.methods
    //     //     .mintTo(
    //     //         new anchor.BN(150) // amount to mint
    //     //     )
    //     //     .accounts({
    //     //         mint: tokenMint,
    //     //         tokenAccount: associatedTokenAddress,
    //     //         mintAuthority: wallet.publicKey,
    //     //     })
    //     //     .rpc({ skipPreflight: true });
    //     // console.log("Your transaction signature", transfertokentx);
    // } catch (error) {
    //     console.error("error", error)
    // }

    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div
                    className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"
                ></div>
                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={onClick}
                    disabled={!publicKey}
                >
                    <div className="hidden group-disabled:block ">Wallet not connected</div>
                    <span className="block group-disabled:hidden">createTokenMints</span>
                </button>

                <button
                    className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                    onClick={createtokenAccountandMintinWallet}
                    disabled={!publicKey}
                >
                    <div className="hidden group-disabled:block ">Wallet not connected</div>
                    <span className="block group-disabled:hidden">createtokenAccountandMintinWallet</span>
                </button>
            </div>
        </div>
    );
};
