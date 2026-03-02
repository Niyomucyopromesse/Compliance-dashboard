import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Loader } from '@/components/common/Loader';
import { api } from '@/services/api';
import { Filter, Plus, Edit2, Save, X, Download, Mail, ChevronDown, Check, Bell } from 'lucide-react';

// BOK Colors
const BOK_COLORS = {
  primary: '#006B3C',
  secondary: '#C8102E',
  accent: '#1E3A8A',
  gold: '#D4AF37',
  lightGreen: '#10B981',
  lightRed: '#EF4444',
  lightBlue: '#3B82F6',
};

interface OwnerInfo {
  owner: string;
  email: string;
}

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'] as const;
const VALIDATION_OPTIONS = ['validated', 'not validated', 'pending'] as const;

const DETAILS_CACHE_KEY = 'details_compliance_initial';
const DETAILS_CACHE_TS_KEY = 'details_compliance_ts';
const DETAILS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getDetailsCache(): {
  departments: string[];
  statuses: string[];
  records: ComplianceRecord[];
  total: number;
  ownersList: OwnerInfo[];
  columns: string[];
  statusColumnName: string;
} | null {
  try {
    const ts = sessionStorage.getItem(DETAILS_CACHE_TS_KEY);
    const raw = sessionStorage.getItem(DETAILS_CACHE_KEY);
    if (!raw || !ts) return null;
    const age = Date.now() - parseInt(ts, 10);
    if (age > DETAILS_CACHE_TTL_MS || age < 0) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setDetailsCache(payload: {
  departments: string[];
  statuses: string[];
  records: ComplianceRecord[];
  total: number;
  ownersList: OwnerInfo[];
  columns: string[];
  statusColumnName: string;
}) {
  try {
    sessionStorage.setItem(DETAILS_CACHE_KEY, JSON.stringify(payload));
    sessionStorage.setItem(DETAILS_CACHE_TS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

interface ComplianceRecord {
  id: number;
  __createdAt?: string;
  __daysRemaining?: number;
  __severity?: string;
  __validation?: string;
  __owner?: OwnerInfo;
  [key: string]: any;
}

export function DetailsPage() {
  const [records, setRecords] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ComplianceRecord>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState<Record<string, any>>({});
  
  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [daysRemainingFilter, setDaysRemainingFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [validationFilter, setValidationFilter] = useState<string>('');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [statusColumnName, setStatusColumnName] = useState<string>('');
  const [ownersList, setOwnersList] = useState<OwnerInfo[]>([]);
  const [ownerMenuRecordId, setOwnerMenuRecordId] = useState<number | null>(null);
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    record: ComplianceRecord | null;
    type: 'automated' | 'customized';
  }>({ open: false, record: null, type: 'automated' });
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [automatedSentRecordId, setAutomatedSentRecordId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifyAllSending, setNotifyAllSending] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Load 50 records at a time
  const [totalRecords, setTotalRecords] = useState(0);

  // Compliance status options
  const complianceStatusOptions = [
    'Compliant',
    'Partially Compliant',
    'Not Compliant'
  ];

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [departmentFilter, statusFilter, daysRemainingFilter, severityFilter, validationFilter]);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, departmentFilter, statusFilter]);

  const fetchRecords = async () => {
    const offset = (currentPage - 1) * pageSize;
    const isInitialLoad = currentPage === 1 && !departmentFilter && !statusFilter;
    const cached = isInitialLoad ? getDetailsCache() : null;
    if (cached) {
      setAvailableDepartments(cached.departments);
      setAvailableStatuses(cached.statuses);
      setRecords(cached.records);
      setTotalRecords(cached.total);
      setOwnersList(cached.ownersList);
      setColumns(cached.columns);
      setStatusColumnName(cached.statusColumnName);
      setLoading(false);
    }

    try {
      if (!cached) setLoading(true);
      const [response, ownersRes] = await Promise.all([
        isInitialLoad
          ? api.getComplianceInitial(pageSize, offset)
          : api.getComplianceRecords(pageSize, offset, departmentFilter || undefined, statusFilter || undefined),
        api.getComplianceOwners(),
      ]);

      const data = isInitialLoad && response?.records ? response.records.data : (response as any)?.data;
      const total = isInitialLoad && response?.records ? response.records.total : (response as any)?.total ?? 0;
      if (isInitialLoad && response?.departments) setAvailableDepartments(response.departments);
      if (isInitialLoad && response?.statuses) setAvailableStatuses(response.statuses);

      if ((response as any)?.success && Array.isArray(data)) {
        let owners: OwnerInfo[] = [];
        if (ownersRes?.success && Array.isArray(ownersRes.data)) {
          owners = ownersRes.data.map((o: { owner?: string; email?: string }) => ({
            owner: String(o?.owner ?? '').trim(),
            email: String(o?.email ?? '').trim(),
          })).filter((o: OwnerInfo) => o.owner || o.email);
        }
        if (!owners.length) {
          owners = [
            { owner: 'Jane Doe', email: 'jane.doe@example.com' },
            { owner: 'John Smith', email: 'john.smith@example.com' },
            { owner: 'Alice Brown', email: 'alice.brown@example.com' },
            { owner: 'Bob Wilson', email: 'bob.wilson@example.com' },
            { owner: 'Carol Davis', email: 'carol.davis@example.com' },
          ];
        }
        const shuffled = [...owners].sort(() => Math.random() - 0.5);
        setOwnersList(shuffled);

        const enrichedRecords = data.map((record: ComplianceRecord, index: number) => {
          const keys = Object.keys(record);
          const createdAtKey = keys.find(
            (k) => k.toLowerCase().includes('created') && k.toLowerCase().includes('at')
          );
          const daysRemainingKey = keys.find(
            (k) => k.toLowerCase().includes('days') && k.toLowerCase().includes('remain')
          );

          // Stable mock seed so values don't jump on every render.
          const numericId =
            typeof record.id === 'number'
              ? record.id
              : Number.parseInt(String(record.id ?? index), 10) || index + 1;

          const mockCreatedAtDate = new Date();
          mockCreatedAtDate.setDate(mockCreatedAtDate.getDate() - ((numericId * 7) % 120));
          mockCreatedAtDate.setHours((numericId * 3) % 24, (numericId * 11) % 60, 0, 0);

          const mockDaysRemaining = 45 - ((numericId * 5) % 70); // Range: -24 to 45

          const createdAtValue = createdAtKey ? record[createdAtKey] : mockCreatedAtDate.toISOString();
          const daysRemainingRaw = daysRemainingKey ? record[daysRemainingKey] : mockDaysRemaining;
          const daysRemainingValue =
            typeof daysRemainingRaw === 'number'
              ? daysRemainingRaw
              : Number.parseInt(String(daysRemainingRaw), 10);

          const __owner = shuffled.length ? shuffled[index % shuffled.length] : undefined;
          const __severity = SEVERITY_OPTIONS[numericId % SEVERITY_OPTIONS.length];
          const __validation = VALIDATION_OPTIONS[numericId % VALIDATION_OPTIONS.length];

          return {
            ...record,
            __createdAt: createdAtValue,
            __daysRemaining: Number.isNaN(daysRemainingValue) ? mockDaysRemaining : daysRemainingValue,
            __severity,
            __validation,
            __owner,
          };
        });

        setRecords(enrichedRecords);
        setTotalRecords(total || data.length);
        
        // Extract columns and statuses
        if (data.length > 0) {
          const firstRecord = data[0];
          const hiddenColumns = ['id', 'index', 'SOURCE_SHEET', 'TIMELINE', 'COMMENT'];
          const emptyColumnsToHide = [
            'ACTION/TIMELINES', 'ACTIONS/TIMELINES', 'TIMELINES',
            'Previous COMMENTS', 'UPDATED COMMENTS', 'IA Current Comments',
            'STATUTE', 'REFERENCE', 'REFERENCE/ARTICLE',
            'DETAIL/REQUIREMENT OF THE REGULATION', 'Ownership',
            'IT ON COMPLIANCE STATUS', 'SUBMISSION ON COMPLIANCE STATUS',
            'REGULATION', 'ARTICLE DETAILS', 'ACTION OWNER', 'COMMENT ON COMPLIANCE STATUS',
          ];
          const isUnnamed = (key: string) => /^Unnamed:\s*\d+$/i.test(key);
          const isCommentColumn = (key: string) => key.trim().toLowerCase().includes('comment');
          const isEmptyColumnToHide = (key: string) =>
            emptyColumnsToHide.some((h) => key.trim().toLowerCase() === h.toLowerCase());
          // Prefer the actual compliance status column (e.g. "COMPLIANCE STATUS", "Status"), not comment columns
          const allKeys = Object.keys(firstRecord);
          const statusCol =
            allKeys.find((k) => {
              const lower = k.toLowerCase();
              if (lower.includes('comment')) return false;
              return (lower === 'status' || lower === 'compliance status' || lower.endsWith('compliance status')) && !lower.includes('comment');
            }) ||
            allKeys.find((k) => {
              const lower = k.toLowerCase();
              if (lower.includes('comment')) return false;
              return lower.includes('status') || lower.includes('compliance');
            });
          // Hide only the generic "Status" column (useless); keep compliance status column (statusCol) visible
          const isUselessStatusColumn = (key: string) =>
            key.trim().toLowerCase() === 'status' && statusCol && key !== statusCol;
          const cols = Object.keys(firstRecord).filter(
            (k) =>
              !hiddenColumns.includes(k) &&
              !isUnnamed(k) &&
              !isCommentColumn(k) &&
              !isUselessStatusColumn(k) &&
              !isEmptyColumnToHide(k)
          );
          setColumns(cols);
          setStatusColumnName(statusCol ?? '');
          if (isInitialLoad) {
            const res = response as { departments?: string[]; statuses?: string[] };
            setDetailsCache({
              departments: res.departments ?? [],
              statuses: res.statuses ?? [],
              records: enrichedRecords,
              total: total || data.length,
              ownersList: shuffled,
              columns: cols,
              statusColumnName: statusCol ?? '',
            });
          }
        }
      } else {
        setRecords([]);
        setTotalRecords(0);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecords([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: ComplianceRecord) => {
    setEditingId(record.id);
    // Only allow editing the status column
    const statusData: Record<string, any> = {};
    if (statusColumnName) {
      statusData[statusColumnName] = record[statusColumnName] || '';
    }
    setEditData(statusData);
  };

  const handleSave = async (id: number) => {
    try {
      // Only send the status column update, not other fields
      const statusUpdate: Record<string, any> = {};
      if (statusColumnName && editData[statusColumnName] !== undefined) {
        statusUpdate[statusColumnName] = editData[statusColumnName];
      }
      
      if (Object.keys(statusUpdate).length === 0) {
        alert('Please select a compliance status');
        return;
      }
      
      const response = await api.updateComplianceRecord(id, statusUpdate);
      if (response.success) {
        await fetchRecords();
        setEditingId(null);
        setEditData({});
      } else {
        alert('Failed to update record');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };


  const handleAdd = async () => {
    try {
      const response = await api.createComplianceRecord(newRecord);
      if (response.success) {
        await fetchRecords();
        setIsAdding(false);
        setNewRecord({});
      } else {
        alert('Failed to create record');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add record');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    const normalized = status.toLowerCase();
    if (normalized === 'compliant') {
      return 'bg-green-100 text-green-800';
    }
    if (normalized === 'partially compliant') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (normalized === 'not compliant') {
      return 'bg-red-100 text-red-800';
    }
    // Fallback for other status values
    if (normalized.includes('compliant') && !normalized.includes('non') && !normalized.includes('partially')) {
      return 'bg-green-100 text-green-800';
    }
    if (normalized.includes('non') || normalized.includes('not')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);
  
  const filteredRecords = useMemo(() => {
    let list = records;
    if (daysRemainingFilter) {
      const selectedDays = Number.parseInt(daysRemainingFilter, 10);
      if (!Number.isNaN(selectedDays)) {
        list = list.filter((record) => {
          const days = record.__daysRemaining;
          return typeof days === 'number' && days >= 0 && days <= selectedDays;
        });
      }
    }
    if (severityFilter) {
      list = list.filter((record) => (record.__severity ?? '').toLowerCase() === severityFilter.toLowerCase());
    }
    if (validationFilter) {
      list = list.filter((record) => (record.__validation ?? '').toLowerCase() === validationFilter.toLowerCase());
    }
    return list;
  }, [records, daysRemainingFilter, severityFilter, validationFilter]);

  const formatCreatedAt = (value: string | undefined) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  };

  /** Format date-only for table cells (e.g. "2/26/2026" without time). */
  const formatDateOnly = (value: unknown): string => {
    if (value == null || value === '') return '-';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString();
  };

  const looksLikeDate = (value: unknown): boolean => {
    if (value == null || value === '') return false;
    const s = String(value);
    const date = new Date(s);
    if (Number.isNaN(date.getTime())) return false;
    return /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s) || /^\d{4}-\d{2}-\d{2}/.test(s) || !Number.isNaN(date.getTime());
  };

  const getDaysRemainingBadgeColor = (days: number) => {
    if (days < 0) return 'bg-red-100 text-red-800';
    if (days <= 7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const handleSendAutomatedEmail = async (record: ComplianceRecord) => {
    const email = record.__owner?.email;
    if (!email) return;
    setEmailSending(true);
    try {
      await api.sendComplianceEmail({ to_email: email, automated: true });
      setOwnerMenuRecordId(null);
      setAutomatedSentRecordId(record.id);
      setToastMessage('Notification has been sent.');
      setTimeout(() => {
        setToastMessage(null);
        setAutomatedSentRecordId(null);
      }, 1500);
    } catch (e) {
      setToastMessage('Failed to send.');
      setTimeout(() => setToastMessage(null), 2000);
    } finally {
      setEmailSending(false);
    }
  };

  const handleOpenCustomizedModal = (record: ComplianceRecord) => {
    setOwnerMenuRecordId(null);
    setEmailModal({ open: true, record, type: 'customized' });
    setCustomSubject('');
    setCustomBody('');
  };

  const handleSendCustomizedEmail = async () => {
    if (!emailModal.record?.__owner?.email) return;
    if (!customSubject.trim()) {
      alert('Please enter a subject.');
      return;
    }
    setEmailSending(true);
    try {
      await api.sendComplianceEmail({
        to_email: emailModal.record.__owner.email,
        subject: customSubject.trim(),
        body: customBody.trim(),
        automated: false,
      });
      setEmailModal({ open: false, record: null, type: 'automated' });
      setCustomSubject('');
      setCustomBody('');
      alert('Email sent successfully.');
    } catch (e) {
      alert('Failed to send email.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleNotifyAllOwners = async () => {
    const emails = Array.from(
      new Set(
        filteredRecords
          .map((r) => r.__owner?.email)
          .filter((e): e is string => Boolean(e && String(e).trim()))
      )
    );
    if (!emails.length) {
      setToastMessage('No owner emails in the current filtered records.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const daysLabel = daysRemainingFilter
      ? { '0': 'today (0 days)', '7': '0–7 days', '14': '0–14 days', '30': '0–30 days', '60': '0–60 days', '90': '0–90 days' }[daysRemainingFilter] || daysRemainingFilter
      : null;
    const subject = daysLabel
      ? `Compliance reminder: ${daysLabel} remaining`
      : 'Compliance notification';
    const body = daysLabel
      ? `This is a reminder that you have compliance items with ${daysLabel} remaining. Please review the Compliance Register and take action as needed.`
      : 'You have compliance items that require your attention. Please review the Compliance Register.';
    setNotifyAllSending(true);
    try {
      const res = await api.notifyComplianceOwners({ to_emails: emails, subject, body });
      if (res.success) {
        setToastMessage(res.sent ? `Notification sent to ${res.sent} owner(s).` : res.message);
      } else {
        setToastMessage(res.message || (res.failed ? `Failed to send to ${res.failed} recipient(s).` : 'Failed to send.'));
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage('Failed to send notifications.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setNotifyAllSending(false);
    }
  };

  const handleExportCsv = () => {
    if (!filteredRecords.length) return;

    const headers = ['ID', 'Created At', 'Days Remaining', ...columns, 'Severity', 'Validation', 'Owners'];

    const escapeCsvValue = (value: unknown) => {
      const stringValue = value === null || value === undefined ? '' : String(value);
      if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const rows = filteredRecords.map((record) => [
      record.id,
      formatCreatedAt(record.__createdAt),
      `${record.__daysRemaining ?? 0}`,
      ...columns.map((col) => record[col] ?? ''),
      record.__severity ?? '',
      record.__validation ?? '',
      record.__owner?.owner ?? '',
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = url;
    link.download = `regmgmt-filtered-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <Button onClick={fetchRecords} className="mt-2">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-w-0 overflow-hidden max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: BOK_COLORS.primary }}>
            Compliance Register Details
          </h1>
          <p className="text-gray-600 mt-1">Manage and update compliance records</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: BOK_COLORS.primary }}
        >
          <Plus className="h-4 w-4" />
          Add New Record
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: BOK_COLORS.primary }}>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </h3>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full h-[40px] px-2.5 py-1.5 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ borderColor: BOK_COLORS.primary, color: '#1f2937' }}
              >
                <option value="">All Departments</option>
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-[40px] px-2.5 py-1.5 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ borderColor: BOK_COLORS.primary, color: '#1f2937' }}
              >
                <option value="">All Statuses</option>
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Days Remaining
              </label>
              <select
                value={daysRemainingFilter}
                onChange={(e) => setDaysRemainingFilter(e.target.value)}
                className="w-full h-[40px] px-2.5 py-1.5 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ borderColor: BOK_COLORS.primary, color: '#1f2937' }}
              >
                <option value="">All</option>
                <option value="0">Today only (0 days)</option>
                <option value="7">0 - 7 days</option>
                <option value="14">0 - 14 days</option>
                <option value="30">0 - 30 days</option>
                <option value="60">0 - 60 days</option>
                <option value="90">0 - 90 days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Severity
              </label>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full h-[40px] px-2.5 py-1.5 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ borderColor: BOK_COLORS.primary, color: '#1f2937' }}
              >
                <option value="">All</option>
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: BOK_COLORS.primary }}>
                <Filter className="h-4 w-4 inline mr-1" />
                Validation
              </label>
              <select
                value={validationFilter}
                onChange={(e) => setValidationFilter(e.target.value)}
                className="w-full h-[40px] px-2.5 py-1.5 text-sm border-2 rounded-lg focus:ring-2 focus:outline-none transition-colors bg-white font-medium"
                style={{ borderColor: BOK_COLORS.primary, color: '#1f2937' }}
              >
                <option value="">All</option>
                {VALIDATION_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 md:col-span-2 flex-wrap">
              <button
                onClick={() => {
                  setDepartmentFilter('');
                  setStatusFilter('');
                  setDaysRemainingFilter('');
                  setSeverityFilter('');
                  setValidationFilter('');
                }}
                className="flex-1 min-w-[140px] h-[40px] px-4 py-1.5 text-sm rounded-lg font-medium transition-colors text-white hover:opacity-90 inline-flex items-center justify-center"
                style={{ backgroundColor: BOK_COLORS.secondary }}
              >
                Clear all filters
              </button>
              <button
                onClick={handleNotifyAllOwners}
                disabled={filteredRecords.length === 0 || notifyAllSending}
                title={`Send notification to all owners of the currently filtered records${ownersList.length ? ` (${ownersList.length} owners in list)` : ''}`}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-[40px] px-4 py-1.5 text-sm rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: BOK_COLORS.gold, color: '#1f2937' }}
              >
                <Bell className="h-4 w-4 shrink-0" />
                {notifyAllSending ? 'Sending…' : 'Notify all owners'}
              </button>
              <button
                onClick={handleExportCsv}
                disabled={filteredRecords.length === 0}
                className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-1.5 h-[40px] px-4 py-1.5 text-sm rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: BOK_COLORS.accent }}
              >
                <Download className="h-4 w-4 shrink-0" />
                Export to CSV
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm font-medium" style={{ color: BOK_COLORS.accent }}>
              Showing <span className="font-bold">{startRecord}</span> - <span className="font-bold">{endRecord}</span> of <span className="font-bold">{totalRecords}</span> records
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: currentPage === 1 ? '#e5e7eb' : BOK_COLORS.primary,
                    color: currentPage === 1 ? '#6b7280' : 'white'
                  }}
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: currentPage === totalPages ? '#e5e7eb' : BOK_COLORS.primary,
                    color: currentPage === totalPages ? '#6b7280' : 'white'
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Record Form */}
      {isAdding && (
        <div className="bg-white rounded-lg shadow-md border-2 overflow-hidden" style={{ borderColor: BOK_COLORS.primary }}>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5" style={{ color: BOK_COLORS.primary }} />
              Add New Record
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.slice(0, 8).map((col) => {
                const isStatusCol = col === statusColumnName || 
                  (col.toLowerCase().includes('status') || col.toLowerCase().includes('compliance'));
                
                return (
                  <div key={col}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {isStatusCol ? (
                      <select
                        value={newRecord[col] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [col]: e.target.value })}
                        className="w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:outline-none transition-all shadow-sm"
                        style={{ 
                          borderColor: BOK_COLORS.primary,
                          color: '#111827',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="">Select Status</option>
                        {complianceStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newRecord[col] || ''}
                        onChange={(e) => setNewRecord({ ...newRecord, [col]: e.target.value })}
                        className="w-full px-3 py-2 border-2 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:outline-none transition-all shadow-sm"
                        style={{ 
                          borderColor: BOK_COLORS.primary,
                          color: '#111827',
                          backgroundColor: '#ffffff'
                        }}
                        placeholder={`Enter ${col}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: BOK_COLORS.primary }}
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewRecord({});
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: BOK_COLORS.accent, color: BOK_COLORS.accent }}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Table - fits page width, no horizontal scroll */}
      <Card className="bg-white overflow-hidden max-w-full">
        <div className="overflow-hidden max-w-full">
          <table className="w-full table-fixed max-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-14">ID</th>
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-24">Created At</th>
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-28">Days Remaining</th>
                {columns.map((col) => (
                  <th key={col} className="px-2 py-3 text-left text-sm font-semibold text-gray-700 truncate" title={col.replace(/_/g, ' ')}>
                    {col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-20">Severity</th>
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-24">Validation</th>
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-32">Owners</th>
                <th className="px-2 py-3 text-left text-sm font-semibold text-gray-700 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 7} className="px-6 py-4 text-center text-gray-500">
                    No records found
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr 
                    key={record.id} 
                    className={editingId === record.id ? "border-2" : "hover:bg-gray-50"}
                    style={editingId === record.id ? { 
                      borderColor: BOK_COLORS.primary,
                      backgroundColor: '#eff6ff'
                    } : {}}
                  >
                    <td className="px-2 py-3 text-sm font-medium text-gray-900 truncate">{record.id}</td>
                    <td className="px-2 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatCreatedAt(record.__createdAt)}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getDaysRemainingBadgeColor(record.__daysRemaining ?? 0)}`}
                      >
                        {(record.__daysRemaining ?? 0)} days
                      </span>
                    </td>
                    {columns.map((col) => {
                      const isStatusCol = col === statusColumnName || 
                        (col.toLowerCase().includes('status') || col.toLowerCase().includes('compliance'));
                      const value = record[col];
                      const displayValue = value != null && value !== '' ? String(value) : '-';
                      const isDate = looksLikeDate(value);
                      const cellContent = isDate ? formatDateOnly(value) : (displayValue === '-' ? '-' : displayValue.substring(0, 80));
                      
                      return (
                        <td key={col} className="px-2 py-3 min-w-0">
                          {editingId === record.id ? (
                            isStatusCol ? (
                              <select
                                value={editData[col] || ''}
                                onChange={(e) => setEditData({ ...editData, [col]: e.target.value })}
                                className="w-full min-w-0 px-2 py-1.5 border-2 rounded-lg text-sm font-medium bg-white focus:ring-2 focus:outline-none transition-all shadow-sm"
                                style={{ 
                                  borderColor: BOK_COLORS.primary,
                                  color: '#111827',
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <option value="">Select Status</option>
                                {complianceStatusOptions.map((status) => (
                                  <option key={status} value={status}>{status}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm text-gray-700 font-medium truncate block">
                                {cellContent}
                              </span>
                            )
                          ) : isStatusCol && (value != null && value !== '') ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold truncate inline-block max-w-full ${getStatusBadgeColor(String(value))}`}>
                              {String(value)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-900 truncate block" title={displayValue !== '-' ? displayValue : undefined}>
                              {cellContent}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-2 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        (record.__severity ?? '').toLowerCase() === 'critical' ? 'bg-red-100 text-red-800' :
                        (record.__severity ?? '').toLowerCase() === 'high' ? 'bg-orange-100 text-orange-800' :
                        (record.__severity ?? '').toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {record.__severity ?? '-'}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-sm text-gray-900 truncate">
                      {record.__validation ?? '-'}
                    </td>
                    <td className="px-2 py-3 relative min-w-0">
                      {record.__owner ? (
                        <div className="inline-block">
                          <button
                            type="button"
                            onClick={() => setOwnerMenuRecordId(ownerMenuRecordId === record.id ? null : record.id)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline focus:outline-none"
                          >
                            {record.__owner.owner}
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          {ownerMenuRecordId === record.id && (
                            <div
                              className="absolute left-4 mt-1 w-64 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl z-10"
                              role="menu"
                            >
                              <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                                Email options
                              </div>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-blue-50 transition-colors"
                                onClick={() => handleOpenCustomizedModal(record)}
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: BOK_COLORS.accent }}>
                                  <Mail className="h-4 w-4" />
                                </span>
                                <div className="text-left">
                                  <span className="font-medium text-gray-800" style={{ color: BOK_COLORS.accent }}>Send customized email</span>
                                  <p className="text-xs text-gray-500">Compose subject & message</p>
                                </div>
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-600 hover:bg-pink-50 disabled:opacity-50 transition-colors"
                                onClick={() => handleSendAutomatedEmail(record)}
                                disabled={emailSending}
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                                  {automatedSentRecordId === record.id ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Bell className="h-4 w-4" />
                                  )}
                                </span>
                                <div className="text-left">
                                  <span className="font-medium text-gray-800">
                                    {automatedSentRecordId === record.id ? 'Sent' : 'Send automated email'}
                                  </span>
                                  <p className="text-xs text-gray-500">Standard reminder (no compose)</p>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      {editingId === record.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(record.id)}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white flex items-center gap-1 transition-colors hover:opacity-90 shadow-sm"
                            style={{ backgroundColor: BOK_COLORS.primary }}
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 flex items-center gap-1 transition-colors hover:bg-gray-50 shadow-sm"
                            style={{ borderColor: BOK_COLORS.secondary, color: BOK_COLORS.secondary }}
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                            style={{ color: BOK_COLORS.accent }}
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Toast: notification sent (1 second) */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg text-white"
          style={{ backgroundColor: BOK_COLORS.primary }}
        >
          <Check className="h-5 w-5 text-white flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Click-outside to close owner dropdown */}
      {ownerMenuRecordId !== null && (
        <div
          className="fixed inset-0 z-[8]"
          aria-hidden
          onClick={() => setOwnerMenuRecordId(null)}
        />
      )}

      {/* Customized email modal – compose template (distinct from automated) */}
      {emailModal.open && emailModal.type === 'customized' && emailModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setEmailModal({ open: false, record: null, type: 'automated' }); setCustomSubject(''); setCustomBody(''); }} />
          <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-200" style={{ backgroundColor: '#f8fafc' }}>
            {/* Header – email-client style */}
            <div className="px-6 py-4 border-b border-gray-200" style={{ backgroundColor: BOK_COLORS.accent }}>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose email
              </h3>
              <p className="text-sm text-blue-100 mt-0.5">Customized message to department owner</p>
            </div>

            {/* To field – read-only */}
            <div className="px-6 py-3 bg-white border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To</label>
              <div className="flex items-center gap-2 text-sm text-gray-900">
                <span className="font-medium">{emailModal.record.__owner?.owner}</span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-700">{emailModal.record.__owner?.email}</span>
              </div>
            </div>

            {/* Subject */}
            <div className="px-6 py-3 bg-white border-b border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="e.g. Compliance update – action required"
                className="w-full px-4 py-2.5 rounded-lg border-2 text-sm bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:outline-none focus:border-transparent"
                style={{ borderColor: BOK_COLORS.primary }}
              />
            </div>

            {/* Body */}
            <div className="px-6 py-3 bg-white">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Message (optional)</label>
              <textarea
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Write your message here…"
                rows={5}
                className="w-full px-4 py-3 rounded-lg border-2 text-sm bg-white text-gray-900 placeholder-gray-500 resize-y focus:ring-2 focus:outline-none focus:border-transparent"
                style={{ borderColor: BOK_COLORS.primary }}
              />
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setEmailModal({ open: false, record: null, type: 'automated' }); setCustomSubject(''); setCustomBody(''); }}
                className="px-4 py-2.5 rounded-lg font-medium border-2 text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ borderColor: BOK_COLORS.accent, color: BOK_COLORS.accent }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendCustomizedEmail}
                disabled={emailSending || !customSubject.trim()}
                className="px-5 py-2.5 rounded-lg font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                style={{ backgroundColor: BOK_COLORS.primary }}
              >
                {emailSending ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    Send email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
