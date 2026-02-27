import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter } from 'lucide-react';

// BOK Colors (Bank of Kenya)
const BOK_COLORS = {
  primary: '#006B3C',      // Dark Green
  secondary: '#C8102E',    // Red
  accent: '#1E3A8A',       // Dark Blue
  gold: '#D4AF37',         // Gold
  lightGreen: '#10B981',   // Light Green
  lightRed: '#EF4444',     // Light Red
  lightBlue: '#3B82F6',    // Light Blue
  gray: '#6B7280'          // Gray
};

const HOME_CACHE_KEY = 'home_compliance_data';
const HOME_CACHE_TS_KEY = 'home_compliance_ts';
const HOME_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function loadHomeCache(): any[] | null {
  try {
    const ts = sessionStorage.getItem(HOME_CACHE_TS_KEY);
    const raw = sessionStorage.getItem(HOME_CACHE_KEY);
    if (!raw || !ts) return null;
    const age = Date.now() - parseInt(ts, 10);
    if (age > HOME_CACHE_TTL_MS || age < 0) return null;
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

function saveHomeCache(data: any[]) {
  try {
    sessionStorage.setItem(HOME_CACHE_KEY, JSON.stringify(data));
    sessionStorage.setItem(HOME_CACHE_TS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  useEffect(() => {
    const cached = loadHomeCache();
    if (cached && cached.length > 0) {
      setRecords(cached);
      setLoading(false);
      fetchData(true);
    } else {
      fetchData(false);
    }
  }, []);

  const fetchData = async (backgroundRefresh = false) => {
    try {
      if (!backgroundRefresh) setLoading(true);
      setError(null);
      const initialResponse = await api.getComplianceInitial(100, 0);
      const data = initialResponse?.records?.data ?? (initialResponse as any)?.data ?? [];
      const list = Array.isArray(data) ? data : [];
      setRecords(list);
      if (list.length > 0) saveHomeCache(list);
    } catch (err: any) {
      const errorMessage = err?.message || err?.detail || 'Failed to load compliance data. Make sure the Excel file exists in the data folder.';
      setError(errorMessage);
      console.error('Error loading compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get department and status columns (helper functions)
  const getDepartmentColumn = () => {
    if (!records || !Array.isArray(records) || records.length === 0) return null;
    return records[0] ? Object.keys(records[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('department') || 
               lowerKey.includes('responsible') ||
               lowerKey.includes('dept') ||
               lowerKey.includes('division') ||
               lowerKey.includes('unit');
      }
    ) : null;
  };

  const getStatusColumn = () => {
    if (!records || !Array.isArray(records) || records.length === 0) return null;
    return records[0] ? Object.keys(records[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('status') || 
               lowerKey.includes('compliance') ||
               lowerKey.includes('state') ||
               lowerKey.includes('condition');
      }
    ) : null;
  };

  // Filter records by department
  const filteredRecords = useMemo(() => {
    if (!departmentFilter || !records.length) return records;
    
    const deptCol = getDepartmentColumn();
    if (!deptCol) return records;

    return records.filter((record: any) => {
      const recordDept = record && record[deptCol] ? String(record[deptCol]).trim() : '';
      return recordDept.toLowerCase() === departmentFilter.toLowerCase();
    });
  }, [records, departmentFilter]);

  // Get available departments for filter
  const availableDepartments = useMemo(() => {
    if (!records || records.length === 0) return [];
    
    const deptCol = getDepartmentColumn();
    if (!deptCol) return [];

    const depts = new Set<string>();
    records.forEach((record: any) => {
      if (record && record[deptCol]) {
        depts.add(String(record[deptCol]).trim());
      }
    });

    return Array.from(depts).sort();
  }, [records]);

  // Process data for visualizations (using filtered records)
  const getStatusDistribution = () => {
    const dataToUse = filteredRecords.length > 0 ? filteredRecords : records;
    
    if (!dataToUse || !Array.isArray(dataToUse) || dataToUse.length === 0) {
      console.log('No records available for status distribution');
      return [];
    }
    
    console.log('Processing status distribution, records count:', dataToUse.length);
    console.log('First record keys:', dataToUse[0] ? Object.keys(dataToUse[0]) : 'No first record');
    
    // Find status column - try multiple variations
    const statusCol = dataToUse[0] ? Object.keys(dataToUse[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('status') || 
               lowerKey.includes('compliance') ||
               lowerKey.includes('state') ||
               lowerKey.includes('condition');
      }
    ) : null;
    
    console.log('Found status column:', statusCol);
    
    if (!statusCol) {
      console.log('No status column found. Available columns:', dataToUse[0] ? Object.keys(dataToUse[0]) : []);
      return [];
    }
    
    const statusCounts: Record<string, number> = {};
    dataToUse.forEach((record: any) => {
      if (record && record[statusCol] !== undefined && record[statusCol] !== null) {
        const status = String(record[statusCol]).trim() || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    
    const result = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    console.log('Status distribution result:', result);
    return result;
  };

  const getDepartmentDistribution = () => {
    const dataToUse = filteredRecords.length > 0 ? filteredRecords : records;
    
    if (!dataToUse || !Array.isArray(dataToUse) || dataToUse.length === 0) {
      console.log('No records available for department distribution');
      return [];
    }
    
    console.log('Processing department distribution, records count:', dataToUse.length);
    
    // Find department column - try multiple variations
    const deptCol = dataToUse[0] ? Object.keys(dataToUse[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('department') || 
               lowerKey.includes('responsible') ||
               lowerKey.includes('dept') ||
               lowerKey.includes('division') ||
               lowerKey.includes('unit');
      }
    ) : null;
    
    console.log('Found department column:', deptCol);
    
    if (!deptCol) {
      console.log('No department column found. Available columns:', dataToUse[0] ? Object.keys(dataToUse[0]) : []);
      return [];
    }
    
    const deptCounts: Record<string, number> = {};
    dataToUse.forEach((record: any) => {
      if (record && record[deptCol] !== undefined && record[deptCol] !== null) {
        const dept = String(record[deptCol]).trim() || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }
    });
    
    // Sort by count and take top 10
    const result = Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    console.log('Department distribution result:', result);
    return result;
  };

  // Calculate compliance statistics
  const getComplianceStats = useMemo(() => {
    if (!records || records.length === 0) {
      return {
        totalDepartments: 0,
        compliant: 0,
        notCompliant: 0,
        partiallyCompliant: 0,
        total: 0
      };
    }

    const deptCol = getDepartmentColumn();
    const statusCol = getStatusColumn();
    
    // Get unique departments
    const departments = new Set<string>();
    if (deptCol) {
      records.forEach((record: any) => {
        if (record && record[deptCol]) {
          departments.add(String(record[deptCol]).trim());
        }
      });
    }

    // Count compliance statuses
    let compliant = 0;
    let notCompliant = 0;
    let partiallyCompliant = 0;

    if (statusCol) {
      records.forEach((record: any) => {
        if (record && record[statusCol]) {
          const status = String(record[statusCol]).trim().toLowerCase();
          if (status === 'compliant') {
            compliant++;
          } else if (status === 'not compliant') {
            notCompliant++;
          } else if (status === 'partially compliant') {
            partiallyCompliant++;
          }
        }
      });
    }

    return {
      totalDepartments: departments.size,
      compliant,
      notCompliant,
      partiallyCompliant,
      total: records.length
    };
  }, [records]);

  // Recalculate stats for filtered records
  const getFilteredComplianceStats = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return {
        compliant: 0,
        notCompliant: 0,
        partiallyCompliant: 0,
        total: 0
      };
    }

    const statusCol = getStatusColumn();
    
    let compliant = 0;
    let notCompliant = 0;
    let partiallyCompliant = 0;

    if (statusCol) {
      filteredRecords.forEach((record: any) => {
        if (record && record[statusCol]) {
          const status = String(record[statusCol]).trim().toLowerCase();
          if (status === 'compliant') {
            compliant++;
          } else if (status === 'not compliant') {
            notCompliant++;
          } else if (status === 'partially compliant') {
            partiallyCompliant++;
          }
        }
      });
    }

    return {
      compliant,
      notCompliant,
      partiallyCompliant,
      total: filteredRecords.length
    };
  }, [filteredRecords]);

  const statusData = getStatusDistribution();
  const departmentData = getDepartmentDistribution();

  const statusColors = [BOK_COLORS.primary, BOK_COLORS.secondary, BOK_COLORS.gold, BOK_COLORS.lightBlue, BOK_COLORS.gray];

  // Calculate percentages
  const totalRecords = getFilteredComplianceStats.total || getComplianceStats.total;
  const compliantPercent = totalRecords > 0 ? Math.round((getFilteredComplianceStats.compliant / totalRecords) * 100) : 0;
  const notCompliantPercent = totalRecords > 0 ? Math.round((getFilteredComplianceStats.notCompliant / totalRecords) * 100) : 0;
  const partiallyCompliantPercent = totalRecords > 0 ? Math.round((getFilteredComplianceStats.partiallyCompliant / totalRecords) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader size="lg" text="Loading compliance data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-red-600 text-lg font-semibold">⚠️ {error}</div>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">

      {/* Department Filter */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200" style={{ backgroundColor: BOK_COLORS.primary }}>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter by Department
          </h3>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ 
                  borderColor: BOK_COLORS.primary,
                  color: '#111827'
                }}
              >
                <option value="">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            {departmentFilter && (
              <button
                onClick={() => setDepartmentFilter('')}
                className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors text-white hover:opacity-90"
                style={{ backgroundColor: BOK_COLORS.secondary }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="text-white rounded-lg shadow-md p-3" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.accent} 0%, ${BOK_COLORS.lightBlue} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-xs opacity-90">Total Departments</div>
            <div className="text-2xl font-bold mt-1">{getComplianceStats.totalDepartments}</div>
            <div className="text-xs opacity-75 mt-0.5">Active departments</div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-3" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.primary} 0%, ${BOK_COLORS.lightGreen} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-xs opacity-90">Compliant</div>
            <div className="text-2xl font-bold mt-1">{getFilteredComplianceStats.compliant}</div>
            <div className="text-xs opacity-75 mt-0.5">
              {compliantPercent}% of {totalRecords}
            </div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-3" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.secondary} 0%, ${BOK_COLORS.lightRed} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-xs opacity-90">Not Compliant</div>
            <div className="text-2xl font-bold mt-1">{getFilteredComplianceStats.notCompliant}</div>
            <div className="text-xs opacity-75 mt-0.5">
              {notCompliantPercent}% of {totalRecords}
            </div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-3" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.gold} 0%, #FCD34D 100%)` }}>
          <div className="flex flex-col">
            <div className="text-xs opacity-90">Partially Compliant</div>
            <div className="text-2xl font-bold mt-1">{getFilteredComplianceStats.partiallyCompliant}</div>
            <div className="text-xs opacity-75 mt-0.5">
              {partiallyCompliantPercent}% of {totalRecords}
            </div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-3" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.gray} 0%, #9CA3AF 100%)` }}>
          <div className="flex flex-col">
            <div className="text-xs opacity-90">Total Records</div>
            <div className="text-2xl font-bold mt-1">{totalRecords}</div>
            <div className="text-xs opacity-75 mt-0.5">
              {departmentFilter ? 'Filtered' : 'All records'}
            </div>
          </div>
        </div>
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Compliance Status Distribution</h3>
          </div>
          <div className="px-4 py-3" style={{ height: '280px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[index % statusColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-gray-500 mb-2">No status data available</div>
                {records && records.length > 0 && records[0] && (
                  <div className="text-xs text-gray-400 mt-2 text-center max-w-md">
                    Available columns: {Object.keys(records[0]).slice(0, 10).join(', ')}
                    {Object.keys(records[0]).length > 10 && '...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Department Distribution Bar Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Top Departments by Compliance Items</h3>
          </div>
          <div className="px-4 py-3" style={{ height: '280px' }}>
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill={BOK_COLORS.primary} name="Compliance Items" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-gray-500 mb-2">No department data available</div>
                {records && records.length > 0 && records[0] && (
                  <div className="text-xs text-gray-400 mt-2 text-center max-w-md">
                    Available columns: {Object.keys(records[0]).slice(0, 10).join(', ')}
                    {Object.keys(records[0]).length > 10 && '...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
