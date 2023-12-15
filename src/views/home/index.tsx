// Next, React
import { FC, useEffect, useState } from "react";
import Link from "next/link";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Components
import { RequestAirdrop } from "../../components/RequestAirdrop";
import pkg from "../../../package.json";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";
import { SendTransaction } from "../../components/SendTransaction";

import { GetTokens } from "components/GetTokens";
import { CreateTokenAccountForm } from "components/CreateTokenAccount";
import { MintToForm } from "components/MintToForm";
import { CreateMintForm } from "components/CreateMint";

export const HomeView: FC = ({}) => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const balance = useUserSOLBalanceStore((s) => s.balance);
    const { getUserSOLBalance } = useUserSOLBalanceStore();

    useEffect(() => {
        if (wallet.publicKey) {
            console.log(wallet.publicKey.toBase58());
            getUserSOLBalance(wallet.publicKey, connection);
        }
    }, [wallet.publicKey, connection, getUserSOLBalance]);

    return (
        <div className="md:px-32 px-4 mx-auto py-12 max-w-7xl">
            <div className="md:px-16 px-4 pt-4 flex flex-col items-start">
                {/* <div className="mt-6">
                    <div className="text-sm font-normal align-bottom text-right text-slate-600 mt-4">
                        v{pkg.version}
                    </div>
                    <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
                        Solana Next
                    </h1>
                </div> */}
                <div className="flex gap-16 w-full">
                    <div className="bg-white border-white bg-blur bg-opacity-30 rounded-lg px-16 py-12 text-xl">
                        You $SOL balance is
                        <h4 className="text-2xl font-semibold text-white mt-4">
                            {wallet && (
                                <div className="flex flex-row justify-center">
                                    <div>{(balance || 0).toLocaleString()}</div>
                                    <div className="text-white ml-2">SOL</div>
                                </div>
                            )}
                        </h4>
                    </div>
                    <div className="flex justify-center items-center m-auto">
                        <div className="">
                            <RequestAirdrop />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-16 w-full mt-16 items-center">
                    <CreateMintForm />
                    <div className="bg-white border-white bg-blur bg-opacity-30 rounded-lg p-8 w-1/2">
                        <CreateTokenAccountForm />
                    </div>
                    <div className="bg-white border-white bg-blur bg-opacity-30 rounded-lg p-8 w-1/2">
                        <MintToForm />
                    </div>
                </div>
            </div>
        </div>
    );
};
