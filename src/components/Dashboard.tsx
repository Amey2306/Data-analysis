import { useState, useMemo } from "react";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  TrendingUp, TrendingDown,
  Upload, Search, Download, CheckCircle2, Filter, CalendarDays, Check, X, ChevronDown, ChevronRight, Menu
} from "lucide-react";
import Papa from "papaparse";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700/50 p-3 rounded-lg shadow-xl shrink-0 min-w-[150px]">
        <p className="text-white font-semibold text-sm mb-2 pb-2 border-b border-slate-700/50">{label || payload[0]?.name}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between items-center text-xs gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></span>
                <span className="text-slate-300 font-medium">{entry.name}:</span>
              </div>
              <span className="text-white font-bold">{entry.value?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

import { 
  adSetPerformance,
  spendTrendData
} from "../data/mockData";

import { DrilldownTable } from './DrilldownTable';
import { WalkinLostTable } from './WalkinLostTable';
import { RawDataTable } from './RawDataTable';
import { LostReasonTable } from './LostReasonTable';

const COLORS = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'];

export function Dashboard() {
  const [adSetData, setAdSetData] = useState<any[]>(adSetPerformance);
  const [globalProjectFilter, setGlobalProjectFilter] = useState('All');
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [adSetSearch, setAdSetSearch] = useState('');
  const [timeFilter, setTimeFilter] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTableView, setActiveTableView] = useState<'drilldown' | 'walkin' | 'lostreason' | 'raw'>('drilldown');
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({ project: true, vendor: true, platform: true, adset: true });
  const [dailyTrendDimension, setDailyTrendDimension] = useState<'total' | 'platform' | 'campaign' | 'adCode'>('total');
  const [rawUploadData, setRawUploadData] = useState<any[]>(() => 
    adSetPerformance.map(row => ({ ...row, _derived: { ...row } }))
  );
  const [rawHeaders, setRawHeaders] = useState<string[]>(Object.keys(adSetPerformance[0] || {}));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const uniqueProjects = ['All', ...Array.from(new Set(adSetData.map(p => p.project)))];
  const uniqueVendors = Array.from(new Set(adSetData.map(c => c.vendor)));
  const uniquePlatforms = Array.from(new Set(adSetData.map(c => c.platform)));

  const handleVendorToggle = (v: string) => {
    setSelectedVendors(prev => 
      prev.includes(v) ? prev.filter(item => item !== v) : [...prev, v]
    );
  };

  const handlePlatformToggle = (p: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const toggleFilter = (key: string) => {
    setOpenFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredRawRows = useMemo(() => {
    return rawUploadData.filter(row => {
      if (!row._derived) return true;
      const camp = row._derived;
      const matchProject = globalProjectFilter === 'All' || camp.project === globalProjectFilter;
      const matchVendor = selectedVendors.length === 0 || selectedVendors.includes(camp.vendor);
      const matchPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(camp.platform);
      const matchAdSet = adSetSearch === '' || (camp.adSet && camp.adSet.toLowerCase().includes(adSetSearch.toLowerCase()));
      
      let matchDate = true;
      if (timeFilter === 'Custom Dates...' && startDate && endDate && camp.date) {
        matchDate = camp.date >= startDate && camp.date <= endDate;
      }
      
      return matchProject && matchVendor && matchPlatform && matchAdSet && matchDate;
    });
  }, [rawUploadData, globalProjectFilter, selectedVendors, selectedPlatforms, adSetSearch, timeFilter, startDate, endDate]);

  const filteredAdSets = useMemo(() => {
    return adSetData.filter(camp => {
      const matchProject = globalProjectFilter === 'All' || camp.project === globalProjectFilter;
      const matchVendor = selectedVendors.length === 0 || selectedVendors.includes(camp.vendor);
      const matchPlatform = selectedPlatforms.length === 0 || selectedPlatforms.includes(camp.platform);
      const matchAdSet = adSetSearch === '' || camp.adSet.toLowerCase().includes(adSetSearch.toLowerCase());
      
      let matchDate = true;
      if (timeFilter === 'Custom Dates...' && startDate && endDate && camp.date) {
        matchDate = camp.date >= startDate && camp.date <= endDate;
      }
      
      return matchProject && matchVendor && matchPlatform && matchAdSet && matchDate;
    });
  }, [globalProjectFilter, selectedVendors, selectedPlatforms, adSetSearch, timeFilter, startDate, endDate]);

  // Derived KPI computations
  const totalLeads = filteredAdSets.reduce((acc, curr) => acc + curr.leads, 0);
  const totalWalkins = filteredAdSets.reduce((acc, curr) => acc + curr.walkins, 0);
  const totalBookings = filteredAdSets.reduce((acc, curr) => acc + curr.bookings, 0);
  const conversionRate = totalLeads ? ((totalBookings / totalLeads) * 100).toFixed(1) : 0;

  const funnel = [
    { stage: 'Leads', count: totalLeads },
    { stage: 'Appointments', count: filteredAdSets.reduce((acc, curr) => acc + curr.appointments, 0) },
    { stage: 'Walk-ins / Visits', count: totalWalkins },
    { stage: 'Bookings (Closed)', count: totalBookings },
  ];

  const sourceDataMap: Record<string, number> = {};
  filteredAdSets.forEach(c => {
    sourceDataMap[c.platform] = (sourceDataMap[c.platform] || 0) + c.leads;
  });
  const sources = Object.entries(sourceDataMap).map(([name, value]) => ({ name, value }));

  // Calculate lost reasons from raw data if available, otherwise simulate based on total leads vs closed
  const actualLostReasonsMap: Record<string, number> = {};
  filteredRawRows.forEach(row => {
    if (row._derived && row._derived.lostReason && row._derived.lostReason.trim() !== '') {
      const reason = row._derived.lostReason.trim();
      actualLostReasonsMap[reason] = (actualLostReasonsMap[reason] || 0) + 1;
    }
  });

  let lostReasons = Object.entries(actualLostReasonsMap)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Show top 10 lost reasons in the chart

  if (lostReasons.length === 0 && totalLeads > 0) {
    // Fallback block to simulated data if no raw reason data exists
    lostReasons = [
      { reason: 'Not Contactable', count: Math.floor(totalLeads * 0.25) },
      { reason: 'Not Interested', count: Math.floor(totalLeads * 0.20) },
      { reason: 'Budget', count: Math.floor(totalLeads * 0.15) },
      { reason: 'Location', count: Math.floor(totalLeads * 0.08) },
      { reason: 'No Plans', count: Math.floor(totalLeads * 0.05) },
    ].filter(r => r.count > 0);
  }


  const projectDataMap: Record<string, { leads: number, siteVisits: number, closed: number }> = {};
  filteredAdSets.forEach(c => {
    if (!projectDataMap[c.project]) projectDataMap[c.project] = { leads: 0, siteVisits: 0, closed: 0 };
    projectDataMap[c.project].leads += c.leads;
    projectDataMap[c.project].siteVisits += c.walkins;
    projectDataMap[c.project].closed += c.bookings;
  });
  const projects = Object.entries(projectDataMap).map(([region, metrics]) => ({ region, ...metrics }));

  // Derived Trend Computations
  const trendDataMap: Record<string, { spend: number, leads: number, walkins: number }> = {};
  filteredAdSets.forEach(d => {
    if (d.date) {
      if (!trendDataMap[d.date]) {
        trendDataMap[d.date] = { spend: 0, leads: 0, walkins: 0 };
      }
      trendDataMap[d.date].spend += (d.spends || d.spend || 0);
      trendDataMap[d.date].leads += (d.leads || 0);
      trendDataMap[d.date].walkins += (d.walkins || 0);
    }
  });

  // Sort dates so chart displays correctly
  const trendChartData = Object.entries(trendDataMap)
    .map(([date, data]) => ({ date, spend: data.spend, leads: data.leads, walkins: data.walkins }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const { dailyLeadFlowChartData, dailyLeadFlowKeys } = useMemo(() => {
    if (dailyTrendDimension === 'total') {
      return { dailyLeadFlowChartData: trendChartData, dailyLeadFlowKeys: ['leads', 'walkins'] };
    }
    
    const datesMap = new Map<string, any>();
    const keyTotals = new Map<string, number>();

    filteredAdSets.forEach(d => {
      if (d.date) {
        if (!datesMap.has(d.date)) datesMap.set(d.date, { date: d.date });
        const obj = datesMap.get(d.date);
        
        let key = d[dailyTrendDimension] || 'Unknown';
        if (typeof key === 'string' && key.trim() === '') key = 'Unknown';
        
        const leads = d.leads || 0;
        obj[key] = (obj[key] || 0) + leads;
        keyTotals.set(key, (keyTotals.get(key) || 0) + leads);
      }
    });

    const sortedKeys = Array.from(keyTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(k => k[0])
      .slice(0, 10); // Show top 10

    const chartData = Array.from(datesMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { 
      dailyLeadFlowChartData: chartData, 
      dailyLeadFlowKeys: sortedKeys 
    };
  }, [trendChartData, filteredAdSets, dailyTrendDimension]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          console.log("File upload successful. Parsed data:", results.data);
          
          try {
            const rawRows = results.data as any[];
            const validRows = rawRows.filter(r => Object.keys(r).length > 1);
            let mappedData: any[] = [];

            if (validRows.length === 0) {
              setToastMessage("File is empty or could not be parsed.");
              return setTimeout(() => setToastMessage(null), 4000);
            }

            const headers = Object.keys(validRows[0]);
            setRawHeaders(headers);
            const isRawLeadData = headers.some(h => ['Enquiry ID', 'Date of Enquiry', 'Enquiry Status'].includes(h));

            const getValRawWrapper = (row: any, keys: string[]) => {
              const lowerKeys = keys.map(k => k.toLowerCase());
              const matchingKey = Object.keys(row).find(k => lowerKeys.includes(k.toLowerCase().trim()));
              return matchingKey ? row[matchingKey] : '';
            };

            const processedRawRows = validRows.map((row) => {
              let project = '', vendor = '', platform = '', campaign = '', adSet = '', adCode = '', walkinSource = '', date = '', lostReason = '';
              if (isRawLeadData) {
                project = getValRawWrapper(row, ['Marketing Project Name', 'Project: Project Name', 'Project Name', 'Project']) || 'Unknown Project';
                vendor = getValRawWrapper(row, ['Actual Vendor Name', 'Actual Vendor', 'Agency', 'Vendor']) || 'Internal';
                platform = getValRawWrapper(row, ['Vendor Name', 'Vendor Name: Vendor Name', 'Platform', 'Source', 'Media']) || 'Unknown';
                campaign = getValRawWrapper(row, ['Name', 'name', 'Campaign Name', 'Campaign', 'CampaignName']) || 'Unknown Campaign';
                adSet = getValRawWrapper(row, ['Plan-Mix', 'Plan mix', 'PlanMix', 'Ad Set', 'Ad Set Name']) || 'General';
                adCode = getValRawWrapper(row, ['Advertisement Code', 'Advertisement code', 'advetisement code', 'Ad Code', 'Ad ID', 'AdID']) || '';
                walkinSource = getValRawWrapper(row, ['Walk-in Source', 'Walk - In Source', 'Walkin Source', 'Walk in Source', 'Site Visit Source', 'SV Source', 'Source of Walk-in', 'Walkin Source Name', 'Walkin Source: Walkin Source', 'Site Visit Vendor', 'Site Visit Source Name', 'Walk In Vendor', 'Channel', 'Channel Type', 'Walk-in Channel', 'Site Visit Channel', 'Final Source', 'Closing Source', 'Conversion Source', 'Sub Source', 'Source Type', 'Visit Source', 'Walkin Details']) || platform;
                lostReason = getValRawWrapper(row, ['Lost Reason', 'Reason for Lost', 'Status Reason', 'Cancellation Reason', 'Reason', 'Drop Reason']) || '';
                
                const dateVal = row['Date of Enquiry'] || row['Last Modified Date'] || '';
                if (dateVal) {
                   const parts = dateVal.split('/');
                   if (parts.length === 3) {
                     date = `${parts[2].trim()}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                   } else {
                     const d = new Date(dateVal);
                     if (!isNaN(d.getTime())) date = d.toISOString().split('T')[0];
                   }
                }
                if (!date || date.length !== 10) date = new Date().toISOString().split('T')[0];
              } else {
                const getVal = (keys: string[]) => getValRawWrapper(row, keys);
                project = getVal(['Project', 'project', 'Project Name', 'Marketing Project Name']) || 'Overall Project';
                vendor = getVal(['Vendor', 'vendor', 'Agency', 'Actual Vendor Name']) || 'Internal';
                platform = getVal(['Platform', 'platform', 'Source', 'Media', 'Vendor Name', 'Vendor Name: Vendor Name']) || 'Unknown';
                campaign = getVal(['Campaign', 'campaign', 'Campaign Name', 'name', 'Name']) || 'Unknown Campaign';
                adSet = getVal(['Ad Set', 'adSet', 'AdSet', 'Ad Set Name', 'AdGroupName', 'Plan-Mix', 'Plan mix']) || 'General';
                adCode = getVal(['Advertisement ID', 'Advertisement Code', 'Ad ID', 'Ad Code', 'AdID', 'Ad_ID', 'ad_id', 'AD code', 'UTM Ad', 'Creative ID', 'Ad Group ID', 'advetisement code']) || '';
                walkinSource = getVal(['Walk-in Source', 'Walk - In Source', 'Walkin Source', 'Walk in Source', 'Site Visit Source', 'SV Source', 'Source of Walk-in', 'Walkin Source Name', 'Walkin Source: Walkin Source', 'Site Visit Vendor', 'Site Visit Source Name', 'Walk In Vendor', 'Channel', 'Channel Type', 'Walk-in Channel', 'Site Visit Channel', 'Final Source', 'Closing Source', 'Conversion Source', 'Sub Source', 'Source Type', 'Visit Source', 'Walkin Details']) || getVal(['Platform', 'platform', 'Source', 'Media', 'Vendor Name', 'Vendor Name: Vendor Name']) || 'Unknown';
                
                const dateVal = getVal(['Date', 'date', 'Day', 'day']);
                date = new Date().toISOString().split('T')[0];
                if (dateVal) {
                  const d = new Date(dateVal);
                  if (!isNaN(d.getTime())) {
                    date = d.toISOString().split('T')[0];
                  } else {
                    date = dateVal; 
                  }
                }
                lostReason = getVal(['Lost Reason', 'Reason for Lost', 'Status Reason', 'Cancellation Reason', 'Reason', 'Drop Reason']) || '';
              }
              return { ...row, _derived: { project, vendor, platform, campaign, adSet, adCode, walkinSource, date, lostReason } };
            });
            setRawUploadData(processedRawRows);

            if (isRawLeadData) {
              // Grouping logic for raw CRM/lead list downloads
              const aggregatedData = new Map();
              
              const getValRaw = (row: any, keys: string[]) => {
                const lowerKeys = keys.map(k => k.toLowerCase());
                const matchingKey = Object.keys(row).find(k => lowerKeys.includes(k.toLowerCase().trim()));
                return matchingKey ? row[matchingKey] : '';
              };

              processedRawRows.forEach((row, i) => {
                const { project, campaign, platform, vendor, adSet, adCode, walkinSource, date: parsedDate } = row._derived;
                
                const key = `${parsedDate}_${project}_${campaign}_${platform}_${vendor}_${adSet}_${adCode}_${walkinSource}`;
                
                if (!aggregatedData.has(key)) {
                  aggregatedData.set(key, {
                    id: `csv-agg-${Date.now()}-${i}`,
                    date: parsedDate,
                    project,
                    campaign,
                    platform,
                    vendor,
                    adSet,
                    adCode,
                    walkinSource,
                    leads: 0,
                    qualified: 0,
                    appointments: 0,
                    walkins: 0,
                    bookings: 0,
                    spends: 0,
                    cpl: 0
                  });
                }
                
                const agg = aggregatedData.get(key);
                agg.leads += 1;
                
                const isCapi = row['CAPI Top Funnel'] === '1' || row['Assign To Sales'] === '1' || row['Status'] === 'Contacted';
                if (isCapi || String(row['Enquiry Status']).toLowerCase().includes('contact')) agg.qualified += 1;
                
                const enqStatus = String(row['Enquiry Status'] || '').toLowerCase();
                const bookStatus = String(row['Booking Status'] || '').toLowerCase();
                
                if (row['Visit AP Count'] === '1' || row['AP Proposed Counter'] === '1' || row['Appointment Done'] === 'Yes' || enqStatus.includes('appointment')) {
                  agg.appointments += 1;
                  agg.qualified += 1;
                }
                
                if (row['Walk-in Counter'] === '1' || row['Site Visit Done'] === '1' || row['Site visit requested'] === '1' || enqStatus.includes('visit') || String(row['Media Type']).toLowerCase().includes('walk') || enqStatus.includes('walkin')) {
                   agg.walkins += 1;
                   agg.appointments += 1;
                   agg.qualified += 1;
                }
                
                if (bookStatus.includes('booking done') || enqStatus.includes('booking') || enqStatus.includes('offer')) {
                   agg.bookings += 1;
                }
              });
              
              mappedData = Array.from(aggregatedData.values());
            } else {
              // Existing logic for summarized dashboard structural dumps
              mappedData = validRows.map((row: any, i) => {
                const getVal = (keys: string[]) => row[keys.find((k: string) => row[k] !== undefined) || ''] || '';
                const getNum = (keys: string[]) => {
                  const val = getVal(keys);
                  if (typeof val === 'string') {
                    return Number(val.replace(/[$,]/g, '')) || 0;
                  }
                  return Number(val) || 0;
                };
                
                const leads = getNum(['Leads', 'Lead', 'leads', 'Total Leads']);
                const spends = getNum(['Spends', 'Spend', 'spends', 'Total Spends', 'Amount Spent']);
                const cpl = leads > 0 ? Math.round(spends / leads) : 0;
                
                const dateVal = getVal(['Date', 'date', 'Day', 'day']);
                let parsedDate = new Date().toISOString().split('T')[0];
                if (dateVal) {
                  const d = new Date(dateVal);
                  if (!isNaN(d.getTime())) {
                    parsedDate = d.toISOString().split('T')[0];
                  } else {
                    parsedDate = dateVal; 
                  }
                }
                
                return {
                  id: `csv-${Date.now()}-${i}`,
                  date: parsedDate,
                  project: getVal(['Project', 'project', 'Project Name', 'Marketing Project Name']) || 'Overall Project',
                  campaign: getVal(['Campaign', 'campaign', 'Campaign Name', 'name', 'Name']) || 'Unknown Campaign',
                  platform: getVal(['Platform', 'platform', 'Source', 'Media', 'Vendor Name', 'Vendor Name: Vendor Name']) || 'Unknown',
                  vendor: getVal(['Vendor', 'vendor', 'Agency', 'Actual Vendor Name']) || 'Internal',
                  adSet: getVal(['Ad Set', 'adSet', 'AdSet', 'Ad Set Name', 'AdGroupName', 'Plan-Mix', 'Plan mix']) || `AdSet ${i+1}`,
                  adCode: getVal(['Advertisement ID', 'Advertisement Code', 'Ad ID', 'Ad Code', 'AdID', 'Ad_ID', 'ad_id', 'AD code', 'UTM Ad', 'Creative ID', 'Ad Group ID', 'advetisement code']) || '',
                  walkinSource: getVal(['Walk-in Source', 'Walk - In Source', 'Walkin Source', 'Walk in Source', 'Site Visit Source', 'SV Source', 'Source of Walk-in', 'Walkin Source Name', 'Walkin Source: Walkin Source', 'Site Visit Vendor', 'Site Visit Source Name', 'Walk In Vendor', 'Channel', 'Channel Type', 'Walk-in Channel', 'Site Visit Channel', 'Final Source', 'Closing Source', 'Conversion Source', 'Sub Source', 'Source Type', 'Visit Source', 'Walkin Details']) || getVal(['Platform', 'platform', 'Source', 'Media', 'Vendor Name', 'Vendor Name: Vendor Name']) || 'Unknown',
                  leads: leads,
                  qualified: getNum(['Qualified', 'qualified', 'Qual', 'QL']),
                  appointments: getNum(['Appointments', 'appointments', 'Appt', 'Site Visit Appt']),
                  walkins: getNum(['Walkins', 'walkins', 'Walk-In', 'Site Visits', 'SV']),
                  bookings: getNum(['Bookings', 'bookings', 'Booking', 'Sales', 'Conversion']),
                  spends: spends,
                  cpl: cpl
                };
              }).filter(row => row.leads > 0 || row.spends > 0 || row.project !== 'Overall Project');
            }
            
            if (mappedData.length > 0) {
              setAdSetData(mappedData);
              setToastMessage(isRawLeadData 
                ? `Successfully grouped ${validRows.length} raw leads into ${mappedData.length} aggregates!`
                : `Successfully loaded ${mappedData.length} metric records!`);
            } else {
              setToastMessage("File parsed, but no relevant mapping keys (Leads/Enquiry IDs) found.");
            }
          } catch (e: any) {
            console.error("Mapping error:", e);
            setToastMessage(`Error mapping data: ${e.message}`);
          }
          
          setTimeout(() => setToastMessage(null), 4000);
        },
        error: (error) => {
          console.error("Error parsing file:", error);
          setToastMessage(`Error parsing file: ${error.message}`);
          setTimeout(() => setToastMessage(null), 4000);
        },
        header: true,
        skipEmptyLines: true
      });
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <button 
            className="lg:hidden p-1.5 -ml-1.5 text-slate-500 hover:text-slate-900 focus:outline-none rounded-md hover:bg-slate-100 transition-colors"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex justify-center items-center w-8 h-8 rounded shrink-0 bg-indigo-600 text-white">
            <TrendingUp strokeWidth={2.5} className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight hidden sm:block">PropAnalytics</span>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
          <span className="text-sm font-medium text-slate-500 font-medium truncate max-w-[120px] sm:max-w-none">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search sales data..."
              className="bg-slate-100 border-none rounded-full px-4 py-1.5 text-sm w-48 lg:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          
          <label className="relative flex items-center justify-center px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
            <Upload className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Upload</span>
            <input 
              type="file" 
              accept=".csv" 
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Main Container width Sidebar Filter */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Filter Sidebar (Like Power BI) */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-0
          w-[280px] lg:w-64 bg-slate-50 border-r border-slate-200 
          flex flex-col shrink-0 overflow-y-auto custom-scrollbar
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          h-full lg:h-auto
        `}>
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between lg:justify-start gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h2 className="font-bold text-slate-800 text-sm">Report Filters</h2>
            </div>
            <button className="lg:hidden text-slate-500 hover:text-slate-800" onClick={() => setIsMobileSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-5 border-b border-slate-200">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5" /> Date Range
            </h3>
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all hover:border-slate-300 cursor-pointer"
            >
              <option value="This Week (Mon-Sun)">This Week (Mon-Sun)</option>
              <option value="This Month">This Month</option>
              <option value="This Quarter">This Quarter</option>
              <option value="Custom Dates...">Custom Dates...</option>
            </select>
            {timeFilter === 'Custom Dates...' && (
              <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-1 bg-slate-100 p-2 rounded-lg border border-slate-200/60">
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1">From</span>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-xs font-medium border border-transparent hover:border-slate-300 rounded bg-white px-2 py-1.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1">To</span>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-xs font-medium border border-transparent hover:border-slate-300 rounded bg-white px-2 py-1.5 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Project Filter */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <button 
                onClick={() => toggleFilter('project')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Project Filter</h3>
                {openFilters.project ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>
              {openFilters.project && (
                <div className="p-2 space-y-1 max-h-[30vh] overflow-y-auto custom-scrollbar border-t border-slate-100">
                  {uniqueProjects.map(p => (
                    <button
                      key={p}
                      onClick={() => setGlobalProjectFilter(p)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
                        globalProjectFilter === p
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                          : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <span className={`truncate w-full text-left ${globalProjectFilter === p ? 'font-semibold' : 'font-medium'}`}>{p === 'All' ? 'All Projects' : p}</span>
                      {globalProjectFilter === p && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Vendor Filter */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => toggleFilter('vendor')}>
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendors</h3>
                  {selectedVendors.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedVendors.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedVendors.length > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedVendors([]) }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2 py-0.5 rounded-full transition-colors border border-indigo-100"
                    >
                      Clear
                    </button>
                  )}
                  {openFilters.vendor ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              {openFilters.vendor && (
                <div className="p-2 space-y-1 max-h-[25vh] overflow-y-auto custom-scrollbar border-t border-slate-100">
                  {uniqueVendors.map(v => (
                    <button
                      key={v}
                      onClick={() => handleVendorToggle(v)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
                        selectedVendors.includes(v)
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                          : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-slate-100'
                      }`}
                    >
                      <span className={`truncate w-full text-left ${selectedVendors.includes(v) ? 'font-semibold' : 'font-medium'}`}>{v}</span>
                      <div className={`w-4 h-4 rounded items-center justify-center flex shrink-0 ml-2 transition-colors ${
                        selectedVendors.includes(v) ? 'bg-emerald-600 text-white border border-emerald-600' : 'border border-slate-300 bg-white'
                      }`}>
                        {selectedVendors.includes(v) && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Platform Filter */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => toggleFilter('platform')}>
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Platforms</h3>
                  {selectedPlatforms.length > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selectedPlatforms.length}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedPlatforms.length > 0 && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedPlatforms([]) }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-2 py-0.5 rounded-full transition-colors border border-indigo-100"
                    >
                      Clear
                    </button>
                  )}
                  {openFilters.platform ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              {openFilters.platform && (
                <div className="p-2 space-y-1 max-h-[25vh] overflow-y-auto custom-scrollbar border-t border-slate-100">
                  {uniquePlatforms.map(p => (
                    <button
                      key={p}
                      onClick={() => handlePlatformToggle(p)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 border ${
                        selectedPlatforms.includes(p)
                          ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                          : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-slate-100'
                      }`}
                    >
                      <span className={`truncate w-full text-left ${selectedPlatforms.includes(p) ? 'font-semibold' : 'font-medium'}`}>{p}</span>
                      <div className={`w-4 h-4 rounded items-center justify-center flex shrink-0 ml-2 transition-colors ${
                        selectedPlatforms.includes(p) ? 'bg-amber-500 text-white border border-amber-500' : 'border border-slate-300 bg-white'
                      }`}>
                        {selectedPlatforms.includes(p) && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Ad Set Search */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => toggleFilter('adset')}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ad Set Name</h3>
                {openFilters.adset ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </div>
              {openFilters.adset && (
                <div className="p-3 border-t border-slate-100">
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="Search Ad Sets..."
                      value={adSetSearch}
                      onChange={(e) => setAdSetSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pl-9 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all shadow-sm focus:border-slate-300"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    {adSetSearch && (
                      <button 
                        onClick={() => setAdSetSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashoard Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto bg-white">
        
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Sales Performance</h1>
          <div className="flex gap-2 text-xs font-semibold uppercase tracking-wider overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 shrink-0 shadow-sm">Week</button>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-slate-500 hover:bg-slate-50 shrink-0 shadow-sm">Month</button>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-md shrink-0 shadow-sm">Quarter</button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <KpiCard 
            title="Total Enquiries" 
            value={totalLeads.toLocaleString()}
            change={`+12%`}
            changeType="positive"
            subtitle="vs prev. quarter"
          />
          <KpiCard 
            title="Site Visits Done (AD)" 
            value={totalWalkins.toLocaleString()}
            change={`+8%`}
            changeType="positive"
            subtitle="vs prev. quarter"
          />
          <KpiCard 
            title="Closed Deals" 
            value={totalBookings.toLocaleString()}
            change="+4.1%"
            changeType="positive"
            subtitle="vs prev. quarter"
          />
          <KpiCard 
            title="Conversion Rate" 
            value={`${conversionRate}%`}
            change="+1.5%"
            changeType="positive"
            subtitle="vs prev. quarter"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 min-h-[320px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Funnel Progression</CardTitle>
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Enquiries</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[320px]">
            <CardHeader>
              <CardTitle>Lost Reasons Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lostReasons} margin={{ top: 5, right: 10, bottom: 5, left: -20 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis dataKey="reason" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 500}} width={100} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" name="Lost Leads" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16}>
                      {lostReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 2 ? '#ef4444' : '#fca5a5'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Row: Project, Spend, and Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="min-h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Project Performance Overview</CardTitle>
              <button className="text-indigo-600 text-xs font-semibold hover:text-indigo-700 flex items-center">
                <Download className="w-3 h-3 mr-1" />
                Export
              </button>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projects} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 500 }} />
                    <Bar dataKey="leads" name="Total Leads" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="siteVisits" name="Site Visits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                    <Bar dataKey="closed" name="Closed Deals" fill="#10b981" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[350px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ad Spend Trend</CardTitle>
              <div className="flex gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Spend (INR)</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendChartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="spend" name="Ad Spend" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="min-h-[350px]">
            <CardHeader>
              <CardTitle>Lead Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] w-full flex justify-center items-center mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sources}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {sources.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Row: Full Width Daily Lead Flow */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="min-h-[350px]">
            <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <CardTitle>Daily Lead Flow Trend</CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm font-medium w-full sm:w-auto">
                <span className="text-slate-500 whitespace-nowrap">Group By:</span>
                <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200 overflow-x-auto hide-scrollbar w-full sm:w-auto">
                  <button 
                    onClick={() => setDailyTrendDimension('total')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${dailyTrendDimension === 'total' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >Total</button>
                  <button 
                    onClick={() => setDailyTrendDimension('platform')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${dailyTrendDimension === 'platform' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >Platform</button>
                  <button 
                    onClick={() => setDailyTrendDimension('campaign')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${dailyTrendDimension === 'campaign' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >Campaign</button>
                  <button 
                    onClick={() => setDailyTrendDimension('adCode')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all whitespace-nowrap ${dailyTrendDimension === 'adCode' ? 'bg-white shadow-sm text-indigo-700 font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >Ad Code</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyLeadFlowChartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {dailyTrendDimension === 'total' ? (
                      <>
                        <Line type="monotone" dataKey="leads" name="Leads" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="walkins" name="Walk-ins" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                      </>
                    ) : (
                      dailyLeadFlowKeys.map((key, index) => {
                        const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
                        const color = COLORS[index % COLORS.length];
                        return (
                          <Line key={key} type="monotone" dataKey={key} name={key} stroke={color} strokeWidth={2} dot={{ r: 3, fill: color, strokeWidth: 1, stroke: '#fff' }} activeDot={{ r: 5 }} />
                        )
                      })
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Data Table */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2 mb-2 p-1 bg-slate-100 rounded-lg self-start">
            <button
              onClick={() => setActiveTableView('drilldown')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTableView === 'drilldown' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Drilldown View
            </button>
            <button
              onClick={() => setActiveTableView('walkin')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTableView === 'walkin' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Walk-in Source Analysis
            </button>
            <button
              onClick={() => setActiveTableView('lostreason')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTableView === 'lostreason' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Lost Reason Analysis
            </button>
            <button
              onClick={() => setActiveTableView('raw')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTableView === 'raw' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              Raw Data List
            </button>
          </div>

          {activeTableView === 'drilldown' && (
            <Card className="overflow-hidden flex flex-col">
              <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform & Ad-Set Performance (Drilldown)</h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button className="text-indigo-600 text-xs font-semibold hover:text-indigo-700 flex items-center">
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </button>
                </div>
              </div>
              <DrilldownTable data={filteredAdSets} />
            </Card>
          )}
          
          {activeTableView === 'walkin' && <WalkinLostTable data={filteredAdSets} />}
          {activeTableView === 'lostreason' && <LostReasonTable data={filteredRawRows} />}
          {activeTableView === 'raw' && <RawDataTable data={filteredRawRows} headers={rawHeaders} />}
        </div>

        </div>
      </div>
    </main>
  );
}

function KpiCard({ 
  title, 
  value, 
  change, 
  changeType, 
  subtitle,
  customColor
}: { 
  title: string, 
  value: string, 
  change: string, 
  changeType: 'positive' | 'negative' | 'custom',
  subtitle: string,
  customColor?: string
}) {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
      <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">{title}</div>
      <div className="text-2xl sm:text-3xl font-bold mt-1 text-slate-900">{value}</div>
      <div className={`text-xs font-bold flex items-center mt-3 ${
        changeType === 'positive' ? 'text-emerald-600' : 
        changeType === 'negative' ? 'text-rose-600' : 
        customColor
      }`}>
        {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
        {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
        {change} 
        <span className="text-slate-400 font-normal ml-1">{subtitle}</span>
      </div>
    </div>
  );
}
