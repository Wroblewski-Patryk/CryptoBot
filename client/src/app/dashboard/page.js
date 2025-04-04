'use client';
import { useEffect, useState } from "react";
import api from "@/src/lib/api";
import PositionTable from "@/src/components/tablePositions";

export default function DashboardPage() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const fetchAll = () => {
      api.get("/positions")
        .then(res => setPositions(res.data))
        .catch(console.error);
    };
  
    fetchAll();
    const interval = setInterval(fetchAll, 5000); 
  
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="mb-4">Open positions <small>({positions.length})</small></h2>
      {positions && positions.length > 0 ? (
          <PositionTable positions={positions} />
      ) : (
        <p>No positions</p>
      )}
    </div>
  );
}
