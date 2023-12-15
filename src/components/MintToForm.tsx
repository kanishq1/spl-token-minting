import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { FC, useState } from "react";
import {
    createMintToInstruction,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAccount,
} from "@solana/spl-token";

export const MintToForm: FC = () => {
    const [txSig, setTxSig] = useState("");
    const [tokenAccount, setTokenAccount] = useState("");
    const [balance, setBalance] = useState("");
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const link = () => {
        return txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : "";
    };

    const mintTo = async (event) => {
        event.preventDefault();
        if (!connection || !publicKey) {
            return;
        }
        const transaction = new web3.Transaction();

        const mintPubKey = new web3.PublicKey(event.target.mint.value);
        const recipientPubKey = new web3.PublicKey(event.target.recipient.value);
        const amount = event.target.amount.value;

        const associatedToken = await getAssociatedTokenAddress(
            mintPubKey,
            recipientPubKey,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        transaction.add(createMintToInstruction(mintPubKey, associatedToken, publicKey, amount));

        const signature = await sendTransaction(transaction, connection);

        await connection.confirmTransaction(signature, "confirmed");

        setTxSig(signature);
        setTokenAccount(associatedToken.toString());

        const account = await getAccount(connection, associatedToken);
        setBalance(account.amount.toString());
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
                        <label htmlFor="recipient" className="text-xl">
                            Recipient:
                        </label>
                        <input
                            id="recipient"
                            type="text"
                            className="input"
                            placeholder="Enter Recipient PublicKey"
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <label htmlFor="amount" className="text-xl">
                            Amount Tokens to Mint:
                        </label>
                        <input id="amount" type="text" className="input" placeholder="e.g. 100" required />
                    </div>
                    <button type="submit" className="btn">
                        Mint Tokens
                    </button>
                </form>
            ) : (
                <span></span>
            )}
            {txSig ? (
                <div className="flex flex-col gap-y-2">
                    <p>Token Balance: {balance} </p>
                    <p>
                        View your transaction on{" "}
                        <a className="link" href={link()}>
                            Solana Explorer
                        </a>{" "}
                    </p>
                </div>
            ) : null}
        </div>
    );
};
