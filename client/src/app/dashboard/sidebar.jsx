'use client';
import { useEffect, useState } from "react";
import api from "@/src/lib/api";
import StrategiesTable from "@/src/components/tableStrategies";
import ProgressBar from "../../components/progressBar";
import { WalletIcon } from '@heroicons/react/24/outline';

export default function Sidebar(){ 
    const [signals, setSignals] = useState([]);
    const [wallet, setWallet] = useState([]);

    useEffect(() => {
        const fetchAll = () => {
            api.get("/signals")
                .then(res => setSignals(res.data))
                .catch(console.error);
            api.get("/wallet")
                .then(res => setWallet(res.data))
                .catch(console.error);
        }
        fetchAll();
        const interval = setInterval(fetchAll, 1*60*1000); 
      
        return () => clearInterval(interval);
    }, []);

    let percent = wallet.usedBalance / wallet.totalBalance * 100;
    if (isNaN(percent)) percent = 0;

    return(
        <div>
            <div className="flex items-center justify-between">
                <h3 className="mt-4 mb-2">Wallet balance</h3>
                <WalletIcon className=" w-25 text-emerald-300"/>
            </div>  

            <h4>{wallet.usedBalance?.toFixed(2)} / {wallet.totalBalance?.toFixed(2)} <small>$</small></h4>
            <ProgressBar percent={percent} />
            <hr className="mt-4"/> 

            <h3 className="mt-4 mb-4">Signals from strategies <small>({signals.length})</small></h3>
            {signals && signals.length > 0 ? (
                <StrategiesTable signals={signals} />
            ) : (
                <p>No signals</p>
            )}
        </div>
    );
}