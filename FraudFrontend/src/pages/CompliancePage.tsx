import { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// BOK Colors
const BOK_COLORS = {
  primary: '#006B3C',
  secondary: '#C8102E',
  accent: '#1E3A8A',
  gold: '#D4AF37',
  lightGreen: '#10B981',
  lightRed: '#EF4444',
  lightBlue: '#3B82F6',
  gray: '#6B7280'
};

export function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const recordsPerPage = 10;
  const [allRecords, setAllRecords] = useState<any[]>([]); // For chart data

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, recordsData, allRecordsData] = await Promise.all([
        api.getComplianceStats(),
        api.getComplianceRecords(recordsPerPage, currentPage * recordsPerPage),
        api.getComplianceRecords(1000, 0) // Get all records for charts
      ]);
      
      // Handle response structure
      if (statsData && statsData.success) {
        setStats(statsData.data);
      } else if (statsData && statsData.data) {
        setStats(statsData.data);
      } else {
        setStats(statsData);
      }
      
      if (recordsData && recordsData.success) {
        setRecords(recordsData.data || []);
      } else if (recordsData && recordsData.data) {
        setRecords(recordsData.data || []);
      } else if (Array.isArray(recordsData)) {
        setRecords(recordsData);
      } else {
        setRecords([]);
      }
      
      if (allRecordsData && allRecordsData.success) {
        setAllRecords(allRecordsData.data || []);
      } else if (allRecordsData && allRecordsData.data) {
        setAllRecords(allRecordsData.data || []);
      } else if (Array.isArray(allRecordsData)) {
        setAllRecords(allRecordsData);
      } else {
        setAllRecords([]);
      }
    } catch (err) {
      setError('Failed to load compliance data. Make sure the Excel file exists in the data folder.');
      console.error('Error loading compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Process data for visualizations
  const getStatusDistribution = () => {
    if (!allRecords || !Array.isArray(allRecords) || allRecords.length === 0) {
      console.log('Compliance: No records available for status distribution');
      return [];
    }
    
    console.log('Compliance: Processing status distribution, records count:', allRecords.length);
    console.log('Compliance: First record keys:', allRecords[0] ? Object.keys(allRecords[0]) : 'No first record');
    
    // Find status column - try multiple variations
    const statusCol = allRecords[0] ? Object.keys(allRecords[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('status') || 
               lowerKey.includes('compliance') ||
               lowerKey.includes('state') ||
               lowerKey.includes('condition');
      }
    ) : null;
    
    console.log('Compliance: Found status column:', statusCol);
    
    if (!statusCol) {
      console.log('Compliance: No status column found. Available columns:', allRecords[0] ? Object.keys(allRecords[0]) : []);
      return [];
    }
    
    const statusCounts: Record<string, number> = {};
    allRecords.forEach((record: any) => {
      if (record && record[statusCol] !== undefined && record[statusCol] !== null) {
        const status = String(record[statusCol]).trim() || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      }
    });
    
    const result = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    console.log('Compliance: Status distribution result:', result);
    return result;
  };

  const getDepartmentDistribution = () => {
    if (!allRecords || !Array.isArray(allRecords) || allRecords.length === 0) {
      console.log('Compliance: No records available for department distribution');
      return [];
    }
    
    console.log('Compliance: Processing department distribution, records count:', allRecords.length);
    
    // Find department column - try multiple variations
    const deptCol = allRecords[0] ? Object.keys(allRecords[0]).find(
      key => {
        const lowerKey = key.toLowerCase();
        return lowerKey.includes('department') || 
               lowerKey.includes('responsible') ||
               lowerKey.includes('dept') ||
               lowerKey.includes('division') ||
               lowerKey.includes('unit');
      }
    ) : null;
    
    console.log('Compliance: Found department column:', deptCol);
    
    if (!deptCol) {
      console.log('Compliance: No department column found. Available columns:', allRecords[0] ? Object.keys(allRecords[0]) : []);
      return [];
    }
    
    const deptCounts: Record<string, number> = {};
    allRecords.forEach((record: any) => {
      if (record && record[deptCol] !== undefined && record[deptCol] !== null) {
        const dept = String(record[deptCol]).trim() || 'Unknown';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      }
    });
    
    const result = Object.entries(deptCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    console.log('Compliance: Department distribution result:', result);
    return result;
  };

  const statusData = getStatusDistribution();
  const departmentData = getDepartmentDistribution();
  const statusColors = [BOK_COLORS.primary, BOK_COLORS.secondary, BOK_COLORS.gold, BOK_COLORS.lightBlue, BOK_COLORS.lightGreen, BOK_COLORS.gray];

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
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: BOK_COLORS.primary }}>📋 Compliance Register</h1>
          <p className="mt-1 text-sm text-gray-600">
            Statistics and records from Compliance_Register.xlsx
          </p>
        </div>
        <Button onClick={fetchData} size="sm" variant="outline">
          🔄 Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.primary} 0%, ${BOK_COLORS.lightGreen} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Total Records</div>
            <div className="text-3xl font-bold mt-2">{stats?.total_records || 0}</div>
            <div className="text-xs opacity-75 mt-1">In Excel file</div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.lightGreen} 0%, #34D399 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Complete Records</div>
            <div className="text-3xl font-bold mt-2">{stats?.summary?.data_quality?.complete_records || 0}</div>
            <div className="text-xs opacity-75 mt-1">
              {stats?.summary?.data_quality?.completion_rate || '0%'} completion rate
            </div>
          </div>
        </div>
        
        <div className="text-white rounded-lg shadow-md p-6" style={{ background: `linear-gradient(135deg, ${BOK_COLORS.accent} 0%, ${BOK_COLORS.lightBlue} 100%)` }}>
          <div className="flex flex-col">
            <div className="text-sm opacity-90">Columns</div>
            <div className="text-3xl font-bold mt-2">{stats?.columns?.length || 0}</div>
            <div className="text-xs opacity-75 mt-1">Data fields</div>
          </div>
        </div>
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Compliance Status Distribution</h3>
          </div>
          <div className="px-6 py-4" style={{ height: '350px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
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
                {allRecords && allRecords.length > 0 && allRecords[0] && (
                  <div className="text-xs text-gray-400 mt-2 text-center max-w-md">
                    Available columns: {Object.keys(allRecords[0]).slice(0, 10).join(', ')}
                    {Object.keys(allRecords[0]).length > 10 && '...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Department Distribution Bar Chart */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Departments by Compliance Items</h3>
          </div>
          <div className="px-6 py-4" style={{ height: '350px' }}>
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
                {allRecords && allRecords.length > 0 && allRecords[0] && (
                  <div className="text-xs text-gray-400 mt-2 text-center max-w-md">
                    Available columns: {Object.keys(allRecords[0]).slice(0, 10).join(', ')}
                    {Object.keys(allRecords[0]).length > 10 && '...'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Quality Summary */}
      {stats?.summary?.data_quality && (
        <Card title="Data Quality Summary">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="border-l-4 pl-4" style={{ borderColor: BOK_COLORS.lightGreen }}>
              <div className="text-sm text-gray-600">Complete Records</div>
              <div className="text-2xl font-bold" style={{ color: BOK_COLORS.primary }}>
                {stats.summary.data_quality.complete_records}
              </div>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: BOK_COLORS.gold }}>
              <div className="text-sm text-gray-600">Incomplete Records</div>
              <div className="text-2xl font-bold" style={{ color: BOK_COLORS.gold }}>
                {stats.summary.data_quality.incomplete_records}
              </div>
            </div>
            <div className="border-l-4 pl-4" style={{ borderColor: BOK_COLORS.accent }}>
              <div className="text-sm text-gray-600">Completion Rate</div>
              <div className="text-2xl font-bold" style={{ color: BOK_COLORS.accent }}>
                {stats.summary.data_quality.completion_rate}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Numeric Statistics */}
      {stats?.numeric_summary && Object.keys(stats.numeric_summary).length > 0 && (
        <Card title="Numeric Field Statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.numeric_summary).map(([field, values]: [string, any]) => (
              <div key={field} className="p-4 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-900 mb-2">{field}</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mean:</span>
                    <span className="font-medium">{values.mean?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min:</span>
                    <span className="font-medium">{values.min?.toFixed(2) || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max:</span>
                    <span className="font-medium">{values.max?.toFixed(2) || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Columns */}
      {stats?.columns && stats.columns.length > 0 && (
        <Card title="Available Data Fields">
          <div className="flex flex-wrap gap-2">
            {stats.columns.map((col: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: BOK_COLORS.accent }}
              >
                {col}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Records Table */}
      <Card 
        title={`Records (Showing ${currentPage * recordsPerPage + 1}-${Math.min((currentPage + 1) * recordsPerPage, stats?.total_records || 0)} of ${stats?.total_records || 0})`}
        className="overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {stats?.columns?.slice(0, 6).map((col: string, idx: number) => (
                  <th
                    key={idx}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                records.map((record: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {stats?.columns?.slice(0, 6).map((col: string, colIdx: number) => (
                      <td key={colIdx} className="px-6 py-4 text-sm text-gray-900">
                        {record[col] !== null && record[col] !== undefined
                          ? String(record[col]).substring(0, 50)
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center border-t pt-4">
          <Button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            size="sm"
            variant="outline"
          >
            ← Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {Math.ceil((stats?.total_records || 0) / recordsPerPage)}
          </span>
          <Button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={(currentPage + 1) * recordsPerPage >= (stats?.total_records || 0)}
            size="sm"
            variant="outline"
          >
            Next →
          </Button>
        </div>
      </Card>
    </div>
  );
}

