'use client';
import { useEffect, useState } from "react";

import api from "@/src/lib/api";
import Table from "@/src/components/table";

export default function DashboardPage() {
  const [positions, setPositions] = useState([]);
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const fetchAll = () => {
      api.get("/positions")
        .then(res => setPositions(res.data))
        .catch(console.error);
      api.get("/orders")
        .then(res => setOrders(res.data))
        .catch(console.error);  
    };
  
    fetchAll();
    const interval = setInterval(fetchAll, 5 *1000); 
  
    return () => clearInterval(interval);
  }, []);


  const handleClick = async (symbol, side, amount) => {
    if (!symbol || !side || !amount) {
      return alert("Brakuje danych do zamknięcia pozycji.");
    }

    try {
      const response = await api.post("/positions/close", {
        symbol,
        side,
        amount
      });
      alert("Pozycja zamknięta ✅");
    } catch (err) {
      console.error(err);
      alert("❌ Błąd przy zamykaniu pozycji: " + err?.response?.data?.message || err.message);
    }
  };

  const columnsPositions = [
    {
      key: 'side',
      label: 'Side',
      align: 'left',
      render: (row) => {
        const isShort = row.side === 'short';
        const sideSymbol = isShort ? '📉' : '📈';
        const color = isShort ? 'rounded p-2 border border-rose-700 bg-rose-900' : 'text-green-300';
        return <span className={color}>{sideSymbol} {row.side.toUpperCase()}</span>;
      }
    },
    { 
      key: 'symbol', 
      label: 'Symbol',
      align: 'left'
    },
    {
      key: 'margin',
      label: 'Margin [USDT]',
      align: 'right',
      render: (row) => <span className="text-right">{row.margin.toFixed(2)}</span>
    },
    {
      key: 'profitMargin',
      label: 'Margin Profit [USDT]',
      align: 'right',
      render: (row) => {
        const profit = row.profitPercent * row.margin / 100;
        const color = profit > 0 ? 'text-green-300' : profit < 0 ? 'text-rose-300' : 'text-white';
        return <span className={`font-semibold text-right ${color}`}>{profit.toFixed(2)}</span>;
      }
    },
    {
      key: 'profitPercent',
      label: 'Profit [%]',
      align: 'right',
      render: (row) => {
        const color = row.profitPercent > 0 ? 'text-green-300' : row.profitPercent < 0 ? 'text-rose-300' : 'text-white';
        return <span className={`font-semibold text-right ${color}`}>{row.profitPercent.toFixed(2)}</span>;
      }
    },
    {
      key: 'ttp',
      label: 'TTP [%]',
      align: 'right',
      render: (row) => (
        <span className={row.ttp > 0 ? 'text-yellow-300' : 'text-white'}>
          {row.ttp}
        </span>
      )
    },
    {
      key: 'dca',
      label: 'DCA times',
      align: 'right',
      render: (row) => {
        const dcaLevel = parseInt(row.dca);
        return <span className={`text-slate-${100 * dcaLevel}`}>{row.dca}</span>;
      }
    },
    {
      key: 'tsl',
      label: 'TSL [%]',
      align: 'right',
      render: (row) => (
        <span className={row.tsl < 0 ? 'text-fuchsia-300' : 'text-white'}>
          {row.tsl}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Action',
      align: 'center',
      render: (row) => (
        <button
          onClick={() => handleClick(row.symbol, row.side, row.amount)}
          className="px-3 py-1 border border-emerald-600 rounded cursor-pointer bg-emerald-900 hover:bg-emerald-700 text-white"
        >
          CLOSE
        </button>
      )
    }
  ];
  const sortPositions = { key: 'profitPercent', direction: 'desc' }

  const columnsOrders = [
    {
      key: 'symbol',
      label: 'Symbol',
      align: 'left'
    },
    
    {
      key: 'status',
      label: 'Status',
      align: 'left'
    },
    {
      key: 'type',
      label: 'Type',
      align: 'left'
    },
    {
      key: 'side',
      label: 'Side',
      align: 'left'
    },
    {
      key: 'amount',
      label: 'Amount',
      align: 'right',
    }
  ];
  return (
    <div>
      <h2 className="mb-4">Open positions <small>({positions.length})</small></h2>
      <Table 
        data={positions} 
        columns={columnsPositions}
        defaultSort={sortPositions}
        />

      <h2 className="mb-4 mt-4">Open orders <small>({orders.length})</small></h2>
      <Table 
        data={orders} 
        columns={columnsOrders}
        />

    </div>
  );
}
