import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface GroupResult {
  key: string;
  level: number;
  walkinCounts: Record<string, number>;
  totalWalkins: number;
  children?: GroupResult[];
  rawRows?: any[];
}

const groupByLevel = (data: any[], keys: string[], level = 0): GroupResult[] => {
  if (level >= keys.length) return [];

  const keyName = keys[level];
  const groups = new Map<string, GroupResult>();

  data.forEach((row) => {
    let rawVal = row[keyName] || 'Unknown';
    if (keyName === 'adCode' && !row.adCode) rawVal = 'N/A';
    if (keyName === 'vendor' && !row.vendor) rawVal = '(blank)';
    const val = String(rawVal);
    
    if (!groups.has(val)) {
      groups.set(val, {
        key: val,
        level,
        walkinCounts: {},
        totalWalkins: 0,
        rawRows: []
      });
    }

    const g = groups.get(val)!;
    const source = row.walkinSource || row.platform || 'Unknown';
    
    // Only count if this row actually had a walkin
    if (row.walkins > 0) {
      g.walkinCounts[source] = (g.walkinCounts[source] || 0) + row.walkins;
      g.totalWalkins += row.walkins;
    }
    
    g.rawRows!.push(row);
  });

  const result = Array.from(groups.values()).filter(g => g.totalWalkins > 0 || g.rawRows!.some(r => r.walkins > 0));

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

  return result.sort((a, b) => b.totalWalkins - a.totalWalkins);
};

const WalkinLostRow = ({ node, walkinSources, expandedPaths, togglePath, path }: { node: GroupResult, walkinSources: string[], expandedPaths: Set<string>, togglePath: (p: string) => void, path: string }) => {
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
        
        {walkinSources.map(ws => {
          const count = node.walkinCounts[ws] || 0;
          return (
            <td key={ws} className={`px-4 py-3 text-right ${count > 0 ? 'text-slate-700 font-medium' : 'text-slate-300'}`}>
              {count > 0 ? count.toLocaleString() : ''}
            </td>
          );
        })}
        <td className="px-4 py-3 text-right font-bold text-slate-800 bg-slate-50/50 border-l border-slate-200">
          {node.totalWalkins > 0 ? node.totalWalkins.toLocaleString() : ''}
        </td>
      </tr>
      {isExpanded && node.children && node.children.map((child) => (
        <WalkinLostRow key={`${path}-${child.key}`} node={child} walkinSources={walkinSources} expandedPaths={expandedPaths} togglePath={togglePath} path={`${path}-${child.key}`} />
      ))}
    </>
  );
};

export const WalkinLostTable = ({ data }: { data: any[] }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const { groupedData, walkinSources, totals } = useMemo(() => {
    // Collect all walkins > 0 to find unique walkin sources
    const walkinData = data.filter(r => r.walkins > 0);
    const sourcesSet = new Set<string>();
    walkinData.forEach(r => {
      sourcesSet.add(r.walkinSource || r.platform || 'Unknown');
    });
    const sources = Array.from(sourcesSet).sort();

    const hierarchyKeys = ['project', 'vendor', 'platform', 'campaign', 'adCode'];
    const tree = groupByLevel(data, hierarchyKeys, 0);

    const columnTotals: Record<string, number> = {};
    let grandTotal = 0;
    sources.forEach(ws => {
      let sum = 0;
      tree.forEach(node => { sum += (node.walkinCounts[ws] || 0); });
      columnTotals[ws] = sum;
      grandTotal += sum;
    });

    return { groupedData: tree, walkinSources: sources, totals: { columnTotals, grandTotal } };
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

  if (walkinSources.length === 0) {
    return (
      <div className="flex-1 overflow-x-auto border border-slate-200 mt-6 lg:mt-8 bg-white p-6 text-center text-slate-500 rounded-lg shadow-sm">
        No walkins records found to analyze walkin source versus lead source.
      </div>
    );
  }

  return (
    <div className="mt-6 lg:mt-8 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">Walk-in Source vs Lead Source (Drilldown)</h3>
          <p className="text-sm text-slate-500 font-medium">Analyze walkins broken down by Project &gt; Vendor &gt; Platform &gt; Campaign &gt; Ad Code</p>
        </div>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
              <th className="px-4 py-3 whitespace-nowrap min-w-[300px] border-r border-slate-200">Project &gt; Vendor &gt; Platform &gt; Campaign &gt; Ad Code</th>
              {walkinSources.map(ws => (
                <th key={`head-${ws}`} className="px-3 py-3 text-right bg-slate-100/30 whitespace-nowrap">
                  {ws}
                </th>
              ))}
              <th className="px-4 py-3 whitespace-nowrap text-right font-bold text-slate-700 bg-slate-200/50 border-l border-slate-200">Grand Total</th>
            </tr>
          </thead>
          <tbody className="text-sm bg-white border-b-2 border-slate-300">
            {groupedData.length > 0 ? (
              groupedData.map((node) => (
                <WalkinLostRow key={node.key} node={node} walkinSources={walkinSources} expandedPaths={expandedPaths} togglePath={togglePath} path={node.key} />
              ))
            ) : (
              <tr>
                <td colSpan={walkinSources.length + 2} className="px-6 py-12 text-center text-slate-500 text-sm bg-slate-50/50">
                  No data available to display.
                </td>
              </tr>
            )}
          </tbody>
          {groupedData.length > 0 && (
            <tfoot className="bg-slate-50 sticky bottom-0 z-10 shadow-sm font-bold text-slate-900">
              <tr>
                <td className="px-4 py-3 whitespace-nowrap border-r border-slate-200">Grand Total</td>
                {walkinSources.map(ws => (
                  <td key={`total-${ws}`} className="px-4 py-3 text-right">
                    {totals.columnTotals[ws] > 0 ? totals.columnTotals[ws].toLocaleString() : ''}
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
  );
};

