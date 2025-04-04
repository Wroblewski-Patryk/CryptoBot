'use client';
import { useEffect, useState } from "react";
import api from "@/src/lib/api";
import StrategiesTable from "@/src/components/tableStrategies";

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
        };
      
        fetchAll();
        const interval = setInterval(fetchAll, 1*60*1000); 
      
        return () => clearInterval(interval);
    }, []);

    return(
        <div>
            <h3 className="mb-4 mt-4">Wallet balance</h3>
            <h4>Total: {wallet.totalBalance?.toFixed(2)} <small>USDT</small></h4>
            <h4>Used: {wallet.usedBalance?.toFixed(2)} <small>USDT</small></h4>
            <h4>Free: {wallet.freeBalance?.toFixed(2)} <small>USDT</small></h4>
            <hr className="mt-2"/>

            <h3 className="mb-4 mt-4">Signals from strategies <small>({signals.length})</small></h3>
            {signals && signals.length > 0 ? (
                <StrategiesTable signals={signals} />
            ) : (
                <p>No signals</p>
            )}
            <h3 className="mb-4 mt-4">Markets <small>(414)</small></h3>
            <p>No markets</p>
        </div>
    );
}