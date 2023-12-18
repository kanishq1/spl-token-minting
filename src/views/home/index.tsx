// Next, React
import { FC, useEffect, useState } from "react";
import Link from "next/link";

// Wallet
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Components
import { RequestAirdrop } from "../../components/RequestAirdrop";

// Store
import useUserSOLBalanceStore from "../../stores/useUserSOLBalanceStore";

import { CreateTokenAccountForm } from "components/CreateTokenAccount";
import { MintToForm } from "components/MintToForm";
import { CreateMintForm } from "components/CreateMint";
import { TransferToken } from "components/TransferToken";

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
            <div className="md:px-16 px-4 pt-4 flex flex-col items-start gap-y-16">
                <div className="flex flex-col gap-16 w-full items-center">
                    <CreateMintForm />
                    <div className="bg-white border-white bg-blur bg-opacity-30 rounded-lg p-8 lg:w-1/2 w-full">
                        <CreateTokenAccountForm />
                    </div>
                    <div className="bg-white border-white bg-blur bg-opacity-30 rounded-lg p-8 lg:w-1/2 w-full">
                        <MintToForm />
                    </div>
                    <div className="bg-white border-white bg-blur bg-opacity-30 rounded-lg p-8 lg:w-1/2 w-full">
                        <TransferToken />
                    </div>
                </div>

                <div className="flex gap-16 w-full lg:flex-row flex-col-reverse">
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
            </div>
        </div>
    );
};
