import React from 'react';

interface RawDataTableProps {
  data: any[];
  headers?: string[];
}

export const RawDataTable: React.FC<RawDataTableProps> = ({ data, headers }) => {
  if (data.length === 0) {
    return (
      <div className="flex-1 border border-slate-200 bg-white p-6 text-center text-slate-500 rounded-lg shadow-sm">
        No records found matching the current filters.
      </div>
    );
  }

  // If no headers provided, extract from first data object, ignoring internal '_derived'
  const displayHeaders = headers && headers.length > 0 
    ? headers.filter(h => h !== '_derived') 
    : Object.keys(data[0]).filter(k => k !== '_derived' && k !== 'id');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Raw Data View</h3>
          <p className="text-xs text-slate-400 mt-1">Viewing original unaggregated rows</p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
          {data.length} rows
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100/80 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              {displayHeaders.map(col => (
                <th key={col} className="px-4 py-3 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm bg-white divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                {displayHeaders.map(col => {
                  const val = row[col];
                  return (
                    <td key={col} className="px-4 py-2 text-slate-600 whitespace-nowrap max-w-[200px] truncate" title={String(val)}>
                      {val !== undefined && val !== null ? String(val) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
