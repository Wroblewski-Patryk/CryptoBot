export default function StrategiesTable({ strategies }) {  
  return (
      <div className="overflow-x-auto rounded border border-emerald-700">
        <table className="min-w-full text-sm text-white">
          <thead className="bg-emerald-900 text-gray-300 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Symbol</th>
              <th className="px-4 py-2 text-left">Side</th>
              <th className="px-4 py-2 text-right">Strategy</th>
              <th className="px-4 py-2 text-right">Strength</th>
            </tr>
          </thead>
          <tbody className="bg-emerald-800">
            {strategies.map((strategy, index) => {
              return (
                <tr key={index} className="border-t border-emerald-700 hover:bg-emerald-700">
                  <td className="px-4 py-2">{strategy.symbol}</td>
                  <td className="px-4 py-2">{strategy.side}</td>
                  <td className="px-4 py-2 text-right">{strategy.strategy}</td>
                  <td className="px-4 py-2 text-right">{strategy.strength}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }