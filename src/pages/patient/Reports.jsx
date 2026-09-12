import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './Reports.css';

const types = ['all', 'wellness', 'lab', 'consultation', 'other'];
const label = value => value.charAt(0).toUpperCase() + value.slice(1);
const dateText = value => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'lab', file: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({ search, type, status });
      const response = await api.get(`/reports?${query}`);
      setReports(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || 'Failed to load reports.');
    } finally { setLoading(false); }
  }, [search, type, status]);

  useEffect(() => {
    const timer = setTimeout(loadReports, 250);
    return () => clearTimeout(timer);
  }, [loadReports]);

  const uploadReport = async event => {
    event.preventDefault();
    if (!form.file) return setError('Choose a PDF, JPG, or PNG file.');
    setSaving(true); setError(''); setMessage('');
    try {
      const body = new FormData();
      body.append('title', form.title); body.append('type', form.type); body.append('file', form.file);
      const report = await api.upload('/reports/upload', body);
      setReports(current => [report, ...current]);
      setForm({ title: '', type: 'lab', file: null });
      event.target.reset(); setShowUpload(false); setMessage('Report uploaded successfully.');
    } catch (requestError) { setError(requestError.message || 'Failed to upload report.'); }
    finally { setSaving(false); }
  };

  const deleteReport = async report => {
    if (!window.confirm(`Delete ${report.title}?`)) return;
    try { await api.remove(`/reports/${report._id}`); setReports(current => current.filter(item => item._id !== report._id)); setMessage('Report deleted.'); }
    catch (requestError) { setError(requestError.message || 'Failed to delete report.'); }
  };

  const openFile = async (report, download = false) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${report.fileUrl}`, { headers: { Authorization: `Bearer ${localStorage.getItem('healthbook_token')}` } });
      if (!response.ok) throw new Error('Unable to open report file.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a'); link.href = url;
      if (download) link.download = report.fileName || report.title; else link.target = '_blank';
      link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); }
  };

  return <section className="page reports-page">
    <div className="page-heading"><div><p className="eyebrow">INSIGHTS</p><h1>Health reports</h1><p>Securely organize your results, visits, and wellness summaries.</p></div><button className="btn btn-primary" onClick={() => { setShowUpload(current => !current); setError(''); }}>{showUpload ? 'Close form' : '+ Upload report'}</button></div>
    {showUpload && <form className="card form-card report-upload-form" onSubmit={uploadReport}><div className="report-upload-grid"><label>Report title<input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Blood work summary" required /></label><label>Report type<select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>{types.slice(1).map(item => <option key={item} value={item}>{label(item)}</option>)}</select></label><label className="report-file-field">File<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => setForm({ ...form, file: event.target.files[0] })} required /><small>PDF, JPG or PNG up to 10 MB</small></label></div><button className="btn btn-primary" disabled={saving}>{saving ? 'Uploading...' : 'Upload report'}</button></form>}
    {error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}
    <div className="report-toolbar"><input aria-label="Search reports" placeholder="Search reports" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter by type" value={type} onChange={event => setType(event.target.value)}>{types.map(item => <option key={item} value={item}>{item === 'all' ? 'All types' : label(item)}</option>)}</select><select aria-label="Filter by status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option><option value="available">Available</option><option value="archived">Archived</option></select></div>
    <div className="section-title reports-list-heading"><h2>Your reports</h2><span>{reports.length} {reports.length === 1 ? 'report' : 'reports'}</span></div>
    {loading ? <div className="empty-state"><span>...</span><h2>Loading reports...</h2></div> : reports.length === 0 ? <div className="empty-state"><span>⌑</span><h2>No reports found</h2><p>Uploaded medical reports will appear here.</p></div> : <div className="report-list report-list-modern">{reports.map(report => <article key={report._id}><span className="document-icon">⌑</span><div className="report-copy"><h3>{report.title}</h3><p>{label(report.type || 'other')} · {dateText(report.generatedAt || report.createdAt)}</p><small>Doctor: {report.generatedBy?.name || 'Self uploaded'}</small></div><span className="badge confirmed">{label(report.status || 'available')}</span><div className="report-actions"><button className="text-link" onClick={() => openFile(report)}>View</button><button className="text-link" onClick={() => openFile(report, true)}>Download</button><button className="text-link danger-link" onClick={() => deleteReport(report)}>Delete</button></div></article>)}</div>}
  </section>;
}
