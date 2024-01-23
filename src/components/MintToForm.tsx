import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL, Commitment, PublicKey } from "@solana/web3.js";
import { FC, useState } from "react";
import {
    createMintToInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAccount,
} from "@solana/spl-token";
import { LinkIcon, Loader } from "./Icons";
import * as anchor from "@coral-xyz/anchor";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";

import idl from "../../idl.json";

const opts: { preflightCommitment: Commitment } = {
    preflightCommitment: "processed",
};

const programId = new PublicKey(idl.metadata.address);

export const MintToForm: FC = () => {
    const [txSig, setTxSig] = useState("");
    const [tokenAccount, setTokenAccount] = useState("");
    const [balance, setBalance] = useState("");
    const [loading, setLoading] = useState(false);

    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const wallet = useWallet();

    const link = () => {
        return txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : "";
    };

    const getProgram = () => {
        /* create the provider and return it to the caller */

        const provider = new AnchorProvider(connection, wallet as any, opts);
        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programId, provider);
        return program;
    };

    const program = getProgram();

    const mintTo = async (event) => {
        event.preventDefault();

        setLoading(true);
        if (!connection || !publicKey) {
            return;
        }
        const transaction = new web3.Transaction();

        const mintPubKey = new web3.PublicKey(event.target.mint.value);
        // const recipientPubKey = new web3.PublicKey(event.target.recipient.value);
        let amount = event.target.amount.value;
        amount = amount * 10 ** 9;

        const associatedToken = await getAssociatedTokenAddress(
            mintPubKey,
            publicKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        amount = new anchor.BN(amount);

        const createMint = await program.methods
            .mintTo(amount)
            .accounts({
                mint: mintPubKey,
                tokenAccount: associatedToken,
                mintAuthority: publicKey,
            })
            .rpc({ skipPreflight: true });

        setTxSig(createMint);
        setTokenAccount(associatedToken.toString());

        const account = await getAccount(connection, associatedToken);
        setBalance(account.amount.toString());
        setLoading(false);
    };

    return (
        <div>
            {publicKey ? (
                <form onSubmit={mintTo} className="flex flex-col gap-y-8">
                    <div className="flex flex-col gap-y-2">
                        <label htmlFor="mint" className="text-xl">
                            Token Mint:
                        </label>
                        <input id="mint" type="text" className="input" placeholder="Enter Token Mint" required />
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <label htmlFor="amount" className="text-xl">
                            Amount Tokens to Mint:
                        </label>
                        <input id="amount" type="text" className="input" placeholder="e.g. 100" required />
                    </div>
                    <button type="submit" className="btn">
                        {loading && <Loader />} Mint Tokens to your Wallet
                    </button>
                </form>
            ) : (
                <span>Connect Wallet</span>
            )}
            {txSig ? (
                <div className="flex flex-col gap-y-2 mt-4">
                    <p>Token Balance: {parseInt(balance) * 10 ** -9} </p>
                    <p className="flex items-center gap-x-2">
                        View your transaction on
                        <a className="link flex gap-x-2 items-center" href={link()}>
                            Solana Explorer
                            <span className="h-5 w-5">
                                <LinkIcon />
                            </span>
                        </a>
                    </p>
                </div>
            ) : null}
        </div>
    );
};
