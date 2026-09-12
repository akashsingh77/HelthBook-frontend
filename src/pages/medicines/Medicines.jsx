import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './Medicines.css';

const emptyForm = {
  medicineName: '', dosage: '', frequency: '', duration: '',
  startDate: '', endDate: '', instructions: '',
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  : '-';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadMedicines = async () => {
      try {
        const response = await api.get('/medicines/patient');
        setMedicines(Array.isArray(response?.medicines) ? response.medicines : []);
      } catch (requestError) {
        setError(requestError.message || 'Failed to load medicines.');
      } finally {
        setLoading(false);
      }
    };
    loadMedicines();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/medicines/patient', form);
      setMedicines((current) => [response.medicine, ...current]);
      setForm(emptyForm);
      setShowForm(false);
      setMessage('Medicine added to your care plan.');
    } catch (requestError) {
      setError(requestError.message || 'Failed to add medicine.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="page medicines-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CARE PLAN</p>
          <h1>Medicines</h1>
          <p>Keep your daily medicines and schedule in one place.</p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => { setShowForm((current) => !current); setError(''); }}>
          {showForm ? 'Close form' : '+ Add medicine'}
        </button>
      </div>

      {showForm && (
        <form className="card form-card medicine-form" onSubmit={handleSubmit}>
          <div className="medicine-form-grid">
            <label>Medicine name<input name="medicineName" value={form.medicineName} onChange={handleChange} placeholder="Vitamin D" required /></label>
            <label>Dosage<input name="dosage" value={form.dosage} onChange={handleChange} placeholder="1000 IU" required /></label>
            <label>Timing<input name="frequency" value={form.frequency} onChange={handleChange} placeholder="Once daily, after breakfast" required /></label>
            <label>Duration<input name="duration" value={form.duration} onChange={handleChange} placeholder="30 days" required /></label>
            <label>Start date<input name="startDate" type="date" value={form.startDate} onChange={handleChange} required /></label>
            <label>End date<input name="endDate" type="date" value={form.endDate} onChange={handleChange} /></label>
            <label className="medicine-form-wide">Notes<textarea name="instructions" value={form.instructions} onChange={handleChange} placeholder="Optional instructions" rows="3" /></label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Adding...' : 'Save medicine'}</button>
        </form>
      )}

      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      <div className="section-title medicine-list-heading"><h2>My medicines</h2><span>{medicines.length} {medicines.length === 1 ? 'medicine' : 'medicines'}</span></div>

      {loading ? <div className="empty-state"><span>...</span><h2>Loading your medicines...</h2></div> : medicines.length === 0 ? <div className="empty-state"><span>+</span><h2>No medicines added yet</h2><p>Add a medicine to start tracking your care plan.</p></div> : (
        <div className="medicine-grid">
          {medicines.map((medicine) => (
            <article className="card medicine-card" key={medicine._id}>
              <div className="medicine-card-header"><div className="medicine-icon">+</div><div><h3>{medicine.medicineName}</h3><p>{medicine.instructions || 'Your personal medication plan'}</p></div><span className={`medicine-status ${medicine.status === 'Active' || !medicine.status ? 'active' : 'inactive'}`}>{medicine.status || 'Active'}</span></div>
              <div className="medicine-details"><div><small>Dosage</small><strong>{medicine.dosage}</strong></div><div><small>Timing</small><strong>{medicine.frequency}</strong></div><div><small>Duration</small><strong>{medicine.duration}</strong></div></div>
              <div className="medicine-dates"><span>Started {formatDate(medicine.startDate)}</span>{medicine.endDate && <span>Ends {formatDate(medicine.endDate)}</span>}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
