import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './MedicalRecords.css';

const types = ['all', 'lab-report', 'diagnosis', 'vitals', 'other'];
const blank = { title: '', type: 'diagnosis', description: '', recordDate: '' };
const humanize = value => value.replace('-', ' ').replace(/\b\w/g, char => char.toUpperCase());
const dateText = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '-';

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadRecords = useCallback(async () => {
    try { setLoading(true); setError(''); const query = new URLSearchParams({ search, type }); const response = await api.get(`/medical-records?${query}`); setRecords(Array.isArray(response) ? response : []); }
    catch (requestError) { setError(requestError.message || 'Failed to load records.'); }
    finally { setLoading(false); }
  }, [search, type]);

  useEffect(() => { const timer = setTimeout(loadRecords, 250); return () => clearTimeout(timer); }, [loadRecords]);
  const updateForm = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const openCreate = () => { setEditing(null); setForm(blank); setShowForm(true); setError(''); };
  const openEdit = record => { setEditing(record); setForm({ title: record.title, type: record.type, description: record.description || '', recordDate: record.recordDate?.slice(0, 10) || '' }); setShowForm(true); setDetail(null); };
  const submit = async event => { event.preventDefault(); setSaving(true); setError(''); setMessage(''); try { const saved = editing ? await api.patch(`/medical-records/${editing._id}`, form) : await api.post('/medical-records', form); setRecords(current => editing ? current.map(record => record._id === saved._id ? saved : record) : [saved, ...current]); setShowForm(false); setEditing(null); setForm(blank); setMessage(editing ? 'Record updated successfully.' : 'Record added successfully.'); } catch (requestError) { setError(requestError.message || 'Failed to save record.'); } finally { setSaving(false); } };
  const remove = async record => { if (!window.confirm(`Delete ${record.title}?`)) return; try { await api.remove(`/medical-records/${record._id}`); setRecords(current => current.filter(item => item._id !== record._id)); setMessage('Record deleted.'); setDetail(null); } catch (requestError) { setError(requestError.message || 'Failed to delete record.'); } };

  return <section className="page records-page">
    <div className="page-heading"><div><p className="eyebrow">YOUR HISTORY</p><h1>Medical records</h1><p>Keep your diagnoses, visits, and health measurements organized.</p></div><button className="btn btn-primary" onClick={showForm ? () => setShowForm(false) : openCreate}>{showForm ? 'Close form' : '+ Add record'}</button></div>
    {showForm && <form className="card form-card record-form" onSubmit={submit}><div className="record-form-grid"><label>Record title<input name="title" value={form.title} onChange={updateForm} placeholder="Annual blood work" required /></label><label>Record type<select name="type" value={form.type} onChange={updateForm}>{types.slice(1).map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select></label><label>Date<input name="recordDate" type="date" value={form.recordDate} onChange={updateForm} /></label><label className="record-form-wide">Notes<textarea name="description" value={form.description} onChange={updateForm} rows="4" placeholder="Diagnosis, findings, or follow-up notes" /></label></div><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Add record'}</button></form>}
    {error && <p className="form-error">{error}</p>}{message && <p className="form-success">{message}</p>}
    <div className="record-toolbar"><input aria-label="Search records" placeholder="Search records or diagnosis" value={search} onChange={event => setSearch(event.target.value)} /><select aria-label="Filter records by type" value={type} onChange={event => setType(event.target.value)}><option value="all">All record types</option>{types.slice(1).map(item => <option key={item} value={item}>{humanize(item)}</option>)}</select></div>
    <div className="section-title records-list-heading"><h2>Record history</h2><span>{records.length} {records.length === 1 ? 'record' : 'records'}</span></div>
    {loading ? <div className="empty-state"><span>...</span><h2>Loading medical records...</h2></div> : records.length === 0 ? <div className="empty-state"><span>⌑</span><h2>No medical records found</h2><p>Add a record or adjust your search to see your history.</p></div> : <div className="records-grid">{records.map(record => <article className="card record-card" key={record._id}><div className="record-card-top"><span className="document-icon">⌑</span><span className="badge confirmed">{humanize(record.type)}</span></div><h3>{record.title}</h3><div className="record-meta"><span><b>Diagnosis</b>{record.description || 'No diagnosis notes'}</span><span><b>Doctor</b>{record.doctor?.user?.name || record.doctor?.name || 'Self recorded'}</span><span><b>Date</b>{dateText(record.recordDate)}</span></div><div className="record-actions"><button className="text-link" onClick={() => setDetail(record)}>View details</button><button className="text-link" onClick={() => openEdit(record)}>Edit</button><button className="text-link danger-link" onClick={() => remove(record)}>Delete</button></div></article>)}</div>}
    {detail && <div className="record-modal-backdrop" role="presentation" onClick={() => setDetail(null)}><div className="card record-modal" role="dialog" aria-modal="true" aria-labelledby="record-detail-title" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setDetail(null)} aria-label="Close details">×</button><p className="eyebrow">{humanize(detail.type)}</p><h2 id="record-detail-title">{detail.title}</h2><div className="detail-grid"><span><b>Diagnosis / notes</b>{detail.description || 'No notes recorded.'}</span><span><b>Doctor</b>{detail.doctor?.user?.name || detail.doctor?.name || 'Self recorded'}</span><span><b>Record date</b>{dateText(detail.recordDate)}</span></div><div className="modal-actions"><button className="btn" onClick={() => openEdit(detail)}>Edit record</button><button className="btn btn-primary" onClick={() => setDetail(null)}>Done</button></div></div></div>}
  </section>;
}
