'use client';
import { useEffect, useState } from "react";
import api from "@/src/lib/api";
import StrategiesTable from "@/src/components/tableStrategies";
import ProgressBar from "./progressBar";

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
            <h3 className="mt-4 mb-2">Wallet balance</h3>
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