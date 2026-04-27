import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, BarChart2 } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

const StackedBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
    return (
      <div className="bg-slate-900 border-slate-800 p-3 shadow-xl rounded-lg z-50 pointer-events-none min-w-[200px]">
        <p className="font-medium text-slate-200 mb-2 border-b border-slate-700 pb-1 flex justify-between items-center">
          <span className="truncate mr-4">{label}</span>
          <span className="text-slate-400 text-xs font-bold">∑ {total.toLocaleString()}</span>
        </p>
        <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
          {payload.filter((entry: any) => entry.value > 0).sort((a: any, b: any) => b.value - a.value).map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="truncate max-w-[150px]" title={entry.name}>{entry.name}</span>
              </div>
              <span className="font-semibold text-white shrink-0">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface GroupResult {
  key: string;
  level: number;
  reasonCounts: Record<string, number>;
  totalLost: number;
  children?: GroupResult[];
  rawRows?: any[];
}

const groupByLevel = (data: any[], keys: string[], level = 0): GroupResult[] => {
  if (level >= keys.length) return [];

  const keyName = keys[level];
  const groups = new Map<string, GroupResult>();

  data.forEach((row) => {
    const derived = row._derived || {};
    let rawVal = derived[keyName] || 'Unknown';
    if (keyName === 'adCode' && !derived.adCode) rawVal = 'N/A';
    if (keyName === 'vendor' && !derived.vendor) rawVal = '(blank)';
    const val = String(rawVal);
    
    if (!groups.has(val)) {
      groups.set(val, {
        key: val,
        level,
        reasonCounts: {},
        totalLost: 0,
        rawRows: []
      });
    }

    const g = groups.get(val)!;
    const reason = derived.lostReason || '';
    
    if (reason && reason.trim() !== '') {
      const trimmedReason = reason.trim();
      g.reasonCounts[trimmedReason] = (g.reasonCounts[trimmedReason] || 0) + 1;
      g.totalLost += 1;
    }
    
    g.rawRows!.push(row);
  });

  const result = Array.from(groups.values()).filter(g => g.totalLost > 0 || g.rawRows!.some(r => r._derived?.lostReason));

  if (level < keys.length - 1) {
    result.forEach((g) => {
      let currentChildren = groupByLevel(g.rawRows!, keys, level + 1);
      
      while (
        currentChildren.length === 1 && 
        (currentChildren[0].key.toLowerCase() === 'unknown' || currentChildren[0].key.toLowerCase() === 'general' || currentChildren[0].key.toLowerCase() === 'n/a' || currentChildren[0].key.toLowerCase() === 'unknown campaign') &&
        currentChildren[0].level < keys.length - 1
      ) {
        currentChildren = groupByLevel(g.rawRows!, keys, currentChildren[0].level + 1);
      }
      
      g.children = currentChildren;
    });
  }

  return result.sort((a, b) => b.totalLost - a.totalLost);
};

const LostReasonRow = ({ node, lostReasons, expandedPaths, togglePath, path }: { node: GroupResult, lostReasons: string[], expandedPaths: Set<string>, togglePath: (p: string) => void, path: string }) => {
  const isExpanded = expandedPaths.has(path);
  const hasChildren = node.children && node.children.length > 0;
  
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
            {node.level === 4 && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded shrink-0">Ad ID/Code</span>}
          </div>
        </td>
        
        {lostReasons.map(lr => {
          const count = node.reasonCounts[lr] || 0;
          return (
            <td key={lr} className={`px-4 py-3 text-right ${count > 0 ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
              {count > 0 ? count.toLocaleString() : ''}
            </td>
          );
        })}
        <td className="px-4 py-3 text-right font-bold text-slate-800 bg-slate-50/50 border-l border-slate-200">
          {node.totalLost > 0 ? node.totalLost.toLocaleString() : ''}
        </td>
      </tr>
      {isExpanded && node.children && node.children.map((child) => (
        <LostReasonRow key={`${path}-${child.key}`} node={child} lostReasons={lostReasons} expandedPaths={expandedPaths} togglePath={togglePath} path={`${path}-${child.key}`} />
      ))}
    </>
  );
};

export const LostReasonTable = ({ data }: { data: any[] }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [chartDimension, setChartDimension] = useState<'platform' | 'campaign' | 'adCode' | 'project' | 'vendor'>('platform');

  const { groupedData, lostReasons, totals } = useMemo(() => {
    const lostData = data.filter(r => r._derived?.lostReason && r._derived.lostReason.trim() !== '');
    const reasonsSet = new Set<string>();
    lostData.forEach(r => {
      reasonsSet.add(r._derived.lostReason.trim());
    });
    const reasons = Array.from(reasonsSet).sort();

    const hierarchyKeys = ['project', 'vendor', 'platform', 'campaign', 'adCode'];
    const tree = groupByLevel(data, hierarchyKeys, 0);

    const columnTotals: Record<string, number> = {};
    let grandTotal = 0;
    reasons.forEach(lr => {
      let sum = 0;
      tree.forEach(node => { sum += (node.reasonCounts[lr] || 0); });
      columnTotals[lr] = sum;
      grandTotal += sum;
    });

    return { groupedData: tree, lostReasons: reasons, totals: { columnTotals, grandTotal } };
  }, [data]);

  const chartData = useMemo(() => {
    const dimensionGroups = new Map<string, any>();
    data.forEach((row) => {
      const derived = row._derived || {};
      const reason = derived.lostReason?.trim();
      if (reason && reason !== '') {
        let dimVal = derived[chartDimension] || 'Unknown';
        if (chartDimension === 'adCode' && !derived.adCode) dimVal = 'N/A';
        if (chartDimension === 'vendor' && !derived.vendor) dimVal = '(blank)';
        
        if (!dimensionGroups.has(dimVal)) dimensionGroups.set(dimVal, { name: dimVal, total: 0 });
        const group = dimensionGroups.get(dimVal)!;
        group[reason] = (group[reason] || 0) + 1;
        group.total += 1;
      }
    });
    
    return Array.from(dimensionGroups.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Top 15 dimension values
  }, [data, chartDimension]);

  const togglePath = (path: string) => {
    const newPaths = new Set(expandedPaths);
    if (newPaths.has(path)) {
      newPaths.delete(path);
    } else {
      newPaths.add(path);
    }
    setExpandedPaths(newPaths);
  };

  if (lostReasons.length === 0) {
    return (
      <div className="flex-1 border border-slate-200 bg-white p-6 text-center text-slate-500 rounded-lg shadow-sm">
        No lost reasons found in the current dataset. Wait for raw lead data containing reasons to process this.
      </div>
    );
  }

  return (
    <div className="mt-6 lg:mt-8 space-y-6">
      {/* Chart Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Lost Reasons Breakdown
          </h3>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-slate-500">Group By:</span>
            <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
              <button 
                onClick={() => setChartDimension('platform')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${chartDimension === 'platform' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >Platform</button>
              <button 
                onClick={() => setChartDimension('campaign')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${chartDimension === 'campaign' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >Campaign</button>
              <button 
                onClick={() => setChartDimension('adCode')}
                className={`px-3 py-1 text-xs rounded-md transition-all ${chartDimension === 'adCode' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
              >Ad Code</button>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, bottom: 25, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
              <Tooltip content={<StackedBarTooltip />} cursor={{fill: '#f8fafc'}} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
              {lostReasons.map((lr, index) => (
                <Bar key={lr} stackId="a" dataKey={lr} name={lr} fill={COLORS[index % COLORS.length]} barSize={40} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Lost Reasons Analysis (Drilldown)</h3>
            <p className="text-xs text-slate-400 mt-1">Analyze lost leads broken down by Project &gt; Vendor &gt; Platform &gt; Campaign &gt; Ad Code</p>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-100/80 sticky top-0 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 whitespace-nowrap min-w-[300px] border-r border-slate-200">Hierarchy</th>
              {lostReasons.map(lr => (
                <th key={`head-${lr}`} className="px-3 py-3 text-right bg-slate-100/30 whitespace-nowrap truncate max-w-[150px]" title={lr}>
                  {lr}
                </th>
              ))}
              <th className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-700 bg-slate-200/50 border-l border-slate-200">Grand Total</th>
            </tr>
          </thead>
          <tbody className="text-sm bg-white border-b-2 border-slate-300">
            {groupedData.length > 0 ? (
              groupedData.map((node) => (
                <LostReasonRow key={node.key} node={node} lostReasons={lostReasons} expandedPaths={expandedPaths} togglePath={togglePath} path={node.key} />
              ))
            ) : (
              <tr>
                <td colSpan={lostReasons.length + 2} className="px-6 py-12 text-center text-slate-500 text-sm bg-slate-50/50">
                  No data available to display.
                </td>
              </tr>
            )}
          </tbody>
          {groupedData.length > 0 && (
            <tfoot className="bg-slate-50 sticky bottom-0 z-10 shadow-sm font-bold text-slate-900">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200">Grand Total</td>
                {lostReasons.map(lr => (
                  <td key={`total-${lr}`} className="px-4 py-3 text-right">
                    {totals.columnTotals[lr] > 0 ? totals.columnTotals[lr].toLocaleString() : ''}
                  </td>
                ))}
                <td className="px-4 py-3 text-right border-l border-slate-300 bg-slate-200/50">
                  {totals.grandTotal.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
    </div>
  );
};
