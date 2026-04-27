import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AdSetData {
  id: string;
  project: string;
  campaign: string;
  platform: string;
  vendor: string;
  adSet: string;
  adCode: string;
  leads: number;
  qualified: number;
  appointments: number;
  walkins: number;
  bookings: number;
  spends: number;
  cpl: number;
}

interface GroupResult {
  key: string;
  level: number;
  leads: number;
  qualified: number;
  appointments: number;
  walkins: number;
  bookings: number;
  spends: number;
  children?: GroupResult[];
  rawRows?: AdSetData[];
}

const groupBy = (data: AdSetData[], keys: string[], level = 0): GroupResult[] => {
  if (level >= keys.length) return [];

  const keyName = keys[level] as keyof AdSetData;
  const groups = new Map<string, GroupResult>();

  data.forEach((row) => {
    let rawVal = row[keyName] || 'Unknown';
    if (keyName === 'adCode' && !row.adCode) rawVal = 'N/A';
    const val = String(rawVal);
    
    if (!groups.has(val)) {
      groups.set(val, {
        key: val,
        level,
        leads: 0,
        qualified: 0,
        appointments: 0,
        walkins: 0,
        bookings: 0,
        spends: 0,
        rawRows: []
      });
    }

    const g = groups.get(val)!;
    g.leads += row.leads || 0;
    g.qualified += row.qualified || 0;
    g.appointments += row.appointments || 0;
    g.walkins += row.walkins || 0;
    g.bookings += row.bookings || 0;
    g.spends += row.spends || 0;
    g.rawRows!.push(row);
  });

  const result = Array.from(groups.values());

  if (level < keys.length - 1) {
    result.forEach((g) => {
      let currentChildren = groupBy(g.rawRows!, keys, level + 1);
      
      // Flatten single useless children (e.g. Unknown/General) to avoid redundant "Subtotal"-like rows
      while (
        currentChildren.length === 1 && 
        (currentChildren[0].key.toLowerCase() === 'unknown' || currentChildren[0].key.toLowerCase() === 'general' || currentChildren[0].key.toLowerCase() === 'n/a' || currentChildren[0].key.toLowerCase() === 'unknown campaign') &&
        level + 1 < keys.length - 1 // ensure we don't skip the last level
      ) {
        // Skip this level, group by the next level
        currentChildren = groupBy(g.rawRows!, keys, currentChildren[0].level + 1);
      }
      
      g.children = currentChildren;
    });
  }

  return result.sort((a, b) => b.leads - a.leads);
};

const DrilldownRow = ({ node, expandedPaths, togglePath, path }: { node: GroupResult, expandedPaths: Set<string>, togglePath: (p: string) => void, path: string }) => {
  const isExpanded = expandedPaths.has(path);
  const hasChildren = node.children && node.children.length > 0;
  
  const cpl = node.leads > 0 ? Math.round(node.spends / node.leads) : 0;
  const qualPct = node.leads > 0 ? Math.round((node.qualified / node.leads) * 100) : 0;
  const apptPct = node.qualified > 0 ? Math.round((node.appointments / node.qualified) * 100) : 0;
  const walkPct = node.appointments > 0 ? Math.round((node.walkins / node.appointments) * 100) : 0;

  return (
    <>
      <tr className={`hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 ${node.level === 0 ? 'bg-white' : node.level === 1 ? 'bg-slate-50/50' : 'bg-slate-50/30'}`} onClick={() => togglePath(path)}>
        <td className="px-4 py-3 whitespace-nowrap" style={{ paddingLeft: `${node.level * 24 + 16}px` }}>
          <div className="flex items-center text-sm font-medium text-slate-800">
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4 mr-1 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 mr-1 text-slate-400 shrink-0" />
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className={node.level === 0 ? 'font-bold' : ''}>{node.key}</span>
            {node.level === 3 && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded shrink-0">Ad ID/Code</span>}
          </div>
        </td>
        
        {/* Funnel Data */}
        <td className="px-4 py-3 text-right border-l border-slate-100 bg-slate-50/20">
          <div className="font-semibold text-slate-700">{node.leads.toLocaleString()}</div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="font-semibold text-slate-700">{node.qualified.toLocaleString()}</div>
          <div className="text-[10px] font-medium text-slate-400">{qualPct}%</div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="font-semibold text-slate-700">{node.appointments.toLocaleString()}</div>
          <div className="text-[10px] font-medium text-slate-400">{apptPct}%</div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="font-semibold text-slate-700">{node.walkins.toLocaleString()}</div>
          <div className="text-[10px] font-medium text-slate-400">{walkPct}%</div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="font-semibold text-emerald-600">{node.bookings.toLocaleString()}</div>
        </td>

        {/* Cost Data */}
        <td className="px-4 py-3 text-right font-medium text-slate-600 border-l border-slate-100 bg-slate-50/20">
          {node.spends > 0 ? `₹${node.spends.toLocaleString()}` : '-'}
        </td>
        <td className="px-4 py-3 text-right text-slate-500">
          {cpl > 0 ? `₹${cpl.toLocaleString()}` : '-'}
        </td>
      </tr>
      {isExpanded && node.children && node.children.map((child) => (
        <DrilldownRow key={`${path}-${child.key}`} node={child} expandedPaths={expandedPaths} togglePath={togglePath} path={`${path}-${child.key}`} />
      ))}
    </>
  );
};

export const DrilldownTable = ({ data }: { data: any[] }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const groupedData = useMemo(() => {
     return groupBy(data, ['platform', 'campaign', 'adSet', 'adCode']);
  }, [data]);

  const togglePath = (path: string) => {
    const newPaths = new Set(expandedPaths);
    if (newPaths.has(path)) {
      newPaths.delete(path);
    } else {
      newPaths.add(path);
    }
    setExpandedPaths(newPaths);
  };

  const grandTotal = useMemo(() => {
    return groupedData.reduce(
      (acc, curr) => {
        acc.leads += curr.leads || 0;
        acc.qualified += curr.qualified || 0;
        acc.appointments += curr.appointments || 0;
        acc.walkins += curr.walkins || 0;
        acc.bookings += curr.bookings || 0;
        acc.spends += curr.spends || 0;
        return acc;
      },
      { leads: 0, qualified: 0, appointments: 0, walkins: 0, bookings: 0, spends: 0 }
    );
  }, [groupedData]);

  const gtCpl = grandTotal.leads > 0 ? Math.round(grandTotal.spends / grandTotal.leads) : 0;
  const gtQualPct = grandTotal.leads > 0 ? Math.round((grandTotal.qualified / grandTotal.leads) * 100) : 0;
  const gtApptPct = grandTotal.qualified > 0 ? Math.round((grandTotal.appointments / grandTotal.qualified) * 100) : 0;
  const gtWalkPct = grandTotal.appointments > 0 ? Math.round((grandTotal.walkins / grandTotal.appointments) * 100) : 0;

  return (
    <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-200">
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
          <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
            <th className="px-4 py-3 whitespace-nowrap min-w-[300px]">Platform &gt; Campaign &gt; Plan-Mix &gt; Ad Code</th>
            <th className="px-4 py-3 whitespace-nowrap text-right border-l border-slate-200 bg-slate-200/50">Leads</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">Qualified (<span className="text-[9px]">%</span>)</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">Appts (<span className="text-[9px]">%</span>)</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">Walkins (<span className="text-[9px]">%</span>)</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">Bookings</th>
            <th className="px-4 py-3 whitespace-nowrap text-right border-l border-slate-200 bg-slate-200/50">Spends</th>
            <th className="px-4 py-3 whitespace-nowrap text-right">CPL (₹)</th>
          </tr>
        </thead>
        <tbody className="text-sm bg-white border-b-2 border-slate-300">
          {groupedData.length > 0 ? (
            groupedData.map((node) => (
              <DrilldownRow key={node.key} node={node} expandedPaths={expandedPaths} togglePath={togglePath} path={node.key} />
            ))
          ) : (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm bg-slate-50/50">
                No data available to display. Please verify your filters or upload a CSV file.
              </td>
            </tr>
          )}
        </tbody>
        {groupedData.length > 0 && (
          <tfoot className="bg-slate-50 sticky bottom-0 z-10 shadow-sm font-bold text-slate-900">
            <tr>
              <td className="px-4 py-3 whitespace-nowrap">Grand Total</td>
              <td className="px-4 py-3 text-right bg-slate-200/50">{grandTotal.leads.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                {grandTotal.qualified.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal ml-1">({gtQualPct}%)</span>
              </td>
              <td className="px-4 py-3 text-right">
                {grandTotal.appointments.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal ml-1">({gtApptPct}%)</span>
              </td>
              <td className="px-4 py-3 text-right">
                {grandTotal.walkins.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal ml-1">({gtWalkPct}%)</span>
              </td>
              <td className="px-4 py-3 text-right text-emerald-700">{grandTotal.bookings.toLocaleString()}</td>
              <td className="px-4 py-3 text-right bg-slate-200/50">
                {grandTotal.spends > 0 ? `₹${grandTotal.spends.toLocaleString()}` : '-'}
              </td>
              <td className="px-4 py-3 text-right">
                {gtCpl > 0 ? `₹${gtCpl.toLocaleString()}` : '-'}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};
