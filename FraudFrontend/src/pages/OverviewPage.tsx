import { useEffect, useState } from 'react';
import { Card } from '@/components/common/Card';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';

interface DepartmentCompliance {
  department: string;
  total_items: number;
  compliant: number;
  non_compliant: number;
  pending: number;
  compliance_percentage: number;
}

interface ComplianceOverview {
  total_items: number;
  compliant: number;
  non_compliant: number;
  pending: number;
  compliance_percentage: number;
  departments: DepartmentCompliance[];
  last_updated: string;
}

export function OverviewPage() {
  const [overview, setOverview] = useState<ComplianceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the compliance stats endpoint and calculate overview
      const statsResponse = await api.getComplianceStats();
      const recordsResponse = await api.getComplianceRecords(1000, 0);
      
      if (!statsResponse.success || !recordsResponse.success) {
        throw new Error('Failed to fetch compliance data');
      }
      
      const records = recordsResponse.data || [];
      
      if (records.length === 0) {
        setOverview({
          total_items: 0,
          compliant: 0,
          non_compliant: 0,
          pending: 0,
          compliance_percentage: 0,
          departments: [],
          last_updated: new Date().toISOString()
        });
        return;
      }
      
      // Calculate overview from records
      const statusCol = Object.keys(records[0]).find(
        k => k.toLowerCase().includes('status') || k.toLowerCase().includes('compliance')
      ) || null;
      
      let compliant = 0;
      let nonCompliant = 0;
      let pending = 0;
      
      if (statusCol) {
        records.forEach((record: any) => {
          const status = String(record[statusCol] || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non')) {
            compliant++;
          } else if (status.includes('non')) {
            nonCompliant++;
          } else {
            pending++;
          }
        });
      }
      
      const total = records.length;
      const compliancePercentage = total > 0 ? Math.round((compliant / total) * 100) : 0;
      
      // Group by department
      const deptCol = Object.keys(records[0]).find(
        k => k.toLowerCase().includes('department') || k.toLowerCase().includes('responsible')
      ) || null;
      
      const deptMap: Record<string, { total: number; compliant: number; nonCompliant: number; pending: number }> = {};
      
      if (deptCol && statusCol) {
        records.forEach((record: any) => {
          const dept = String(record[deptCol] || 'Unknown');
          if (!deptMap[dept]) {
            deptMap[dept] = { total: 0, compliant: 0, nonCompliant: 0, pending: 0 };
          }
          deptMap[dept].total++;
          const status = String(record[statusCol] || '').toLowerCase();
          if (status.includes('compliant') && !status.includes('non')) {
            deptMap[dept].compliant++;
          } else if (status.includes('non')) {
            deptMap[dept].nonCompliant++;
          } else {
            deptMap[dept].pending++;
          }
        });
      }
      
      const departments = Object.entries(deptMap).map(([department, data]) => ({
        department,
        total_items: data.total,
        compliant: data.compliant,
        non_compliant: data.nonCompliant,
        pending: data.pending,
        compliance_percentage: data.total > 0 ? Math.round((data.compliant / data.total) * 100) : 0
      }));
      
      setOverview({
        total_items: total,
        compliant,
        non_compliant: nonCompliant,
        pending,
        compliance_percentage: compliancePercentage,
        departments,
        last_updated: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance overview');
      console.error('Error loading compliance overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!overview) return null;

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Compliance Overview</h1>
        <p className="text-gray-600 mt-1">
          Last updated: {new Date(overview.last_updated).toLocaleString()}
        </p>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{overview.total_items}</p>
          </div>
        </Card>
        
        <Card className="bg-green-50">
          <div className="p-6">
            <h3 className="text-sm font-medium text-green-700">Compliant</h3>
            <p className="text-3xl font-bold text-green-900 mt-2">{overview.compliant}</p>
          </div>
        </Card>
        
        <Card className="bg-red-50">
          <div className="p-6">
            <h3 className="text-sm font-medium text-red-700">Non-Compliant</h3>
            <p className="text-3xl font-bold text-red-900 mt-2">{overview.non_compliant}</p>
          </div>
        </Card>
        
        <Card className="bg-yellow-50">
          <div className="p-6">
            <h3 className="text-sm font-medium text-yellow-700">Pending</h3>
            <p className="text-3xl font-bold text-yellow-900 mt-2">{overview.pending}</p>
          </div>
        </Card>
      </div>

      {/* Global Compliance Level */}
      <Card className="bg-white">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Bank Compliance</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    overview.compliance_percentage >= 80
                      ? 'bg-green-500'
                      : overview.compliance_percentage >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  } transition-all duration-500`}
                  style={{ width: `${overview.compliance_percentage}%` }}
                />
              </div>
            </div>
            <div className={`text-3xl font-bold ${getStatusColor(overview.compliance_percentage)}`}>
              {overview.compliance_percentage.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Department Breakdown */}
      <Card className="bg-white">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Compliance Levels</h2>
          <div className="space-y-4">
            {overview.departments.map((dept) => (
              <div key={dept.department} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{dept.department}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBgColor(
                      dept.compliance_percentage
                    )} ${getStatusColor(dept.compliance_percentage)}`}
                  >
                    {dept.compliance_percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold text-gray-900">{dept.total_items}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Compliant</p>
                    <p className="font-semibold text-green-600">{dept.compliant}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Non-Compliant</p>
                    <p className="font-semibold text-red-600">{dept.non_compliant}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Pending</p>
                    <p className="font-semibold text-yellow-600">{dept.pending}</p>
                  </div>
                </div>

                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      dept.compliance_percentage >= 80
                        ? 'bg-green-500'
                        : dept.compliance_percentage >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    } transition-all duration-500`}
                    style={{ width: `${dept.compliance_percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

