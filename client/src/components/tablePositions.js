export default function PositionTable({ positions }) {  
  return (
      <div className="overflow-x-auto rounded border border-emerald-700">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-emerald-800 text-gray-100 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Side</th>
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-right">Margin [USDT]</th>
              <th className="px-4 py-2 text-right">Margin profit [USDT]</th>
              <th className="px-4 py-2 text-right">Profit [%]</th>
              <th className="px-4 py-2 text-right">TTP [%]</th>
              <th className="px-4 py-2 text-right">DCA times</th>
              <th className="px-4 py-2 text-right">TSL [%]</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="bg-emerald-900">
            {positions.map((position, index) => {
              const profit = position.profitPercent;
              const profitMargin = position.profitPercent * position.margin /100;
              let sideSymbol = "";
              if (position.side === "short")
                sideSymbol = "📉";
              else 
                sideSymbol = "📈";

              // dobieramy kolor
              let profitColor = "text-white";
              if (profit > 0) profitColor = "text-green-300";
              else if (profit < 0) profitColor = "text-red-300";

              let ttpColor = "text-white";
              if ( position.ttp > 0 ) ttpColor = "text-yellow-300";

              let dcaColor = "text-slate-50";
              if ( position.dca === 1) dcaColor = "text-slate-100";
              else if ( position.dca === 2) dcaColor = "text-slate-200";
              else if ( position.dca === 3) dcaColor = "text-slate-300";
              else if ( position.dca === 4) dcaColor = "text-slate-400";
              

              let tslColor = "text-white";
              if ( position.tsl < 0 ) tslColor = "text-fuchsia-300";

              return (
                <tr key={index} className="border-t border-emerald-600 bg-emerald-700 hover:bg-emerald-800">
                  <td className="px-4 py-2">{sideSymbol + " " + position.side}</td>
                  <td className="px-4 py-2">{position.symbol}</td>
                  <td className="px-4 py-2 text-right">{position.margin.toFixed(2)}</td>
                  <td className={`px-4 py-2 text-right font-semibold ${profitColor}`}>
                    {profitMargin.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2 text-right font-semibold ${profitColor}`}>
                    {profit.toFixed(2)}
                  </td>
                  <td className={`px-4 py-2 text-right ${ttpColor}`}>{position.ttp}</td>
                  <td className={`px-4 py-2 text-right ${dcaColor}`}>{position.dca}</td>
                  <td className={`px-4 py-2 text-right ${tslColor}`}>{position.tsl}</td>
                  <td className="px-4 py-2 text-center">
                    <button className="px-3 py-1 border border-emerald-600 rounded cursor-pointer bg-emerald-900 hover:bg-emerald-700">CLOSE</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }