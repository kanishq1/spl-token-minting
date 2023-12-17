import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js";
import { FC, useState } from "react";

import {
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { CopyIcon, LinkIcon, Loader } from "./Icons";

export const CreateTokenAccountForm: FC = () => {
    const [txSig, setTxSig] = useState("");
    const [tokenAccount, setTokenAccount] = useState("");

    const [loading, setLoading] = useState(false);

    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();

    const link = () => {
        return txSig ? `https://explorer.solana.com/tx/${txSig}?cluster=devnet` : "";
    };

    const createTokenAccount = async (event) => {
        event.preventDefault();

        setLoading(true);
        if (!connection || !publicKey) {
            return;
        }
        const transaction = new web3.Transaction();
        const owner = new web3.PublicKey(event.target.owner.value);
        const mint = new web3.PublicKey(event.target.mint.value);

        const associatedToken = await getAssociatedTokenAddress(
            mint,
            owner,
            false,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        transaction.add(
            createAssociatedTokenAccountInstruction(
                publicKey,
                associatedToken,
                owner,
                mint,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );

        sendTransaction(transaction, connection).then((sig) => {
            setTxSig(sig);
            setTokenAccount(associatedToken.toString());
        });

        setLoading(false);
    };

    return (
        <div className="h-full">
            {publicKey ? (
                <form onSubmit={createTokenAccount} className="flex flex-col gap-y-8 h-full">
                    <div className="flex flex-col gap-y-2">
                        <label htmlFor="mint" className="text-xl">
                            Token Mint
                        </label>

                        <input id="mint" type="text" className="input" placeholder="Enter Token Mint" required />
                    </div>
                    <div className="flex flex-col gap-y-2">
                        <label htmlFor="owner" className="text-xl">
                            Token Account Owner:
                        </label>
                        <input
                            id="owner"
                            type="text"
                            className="input"
                            placeholder="Enter Token Account Owner PublicKey"
                            required
                        />
                    </div>
                    <button type="submit" className="btn mt-auto">
                        {loading && <Loader />}Create Token Account
                    </button>
                </form>
            ) : (
                <span></span>
            )}
            {txSig ? (
                <div className="flex flex-col gap-y-2 mt-4">
                    <p className="break-words">
                        Token Account Address: <span className="text-gray-400">{tokenAccount}</span>
                    </p>
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
