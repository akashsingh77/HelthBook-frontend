import { useEffect, useState } from 'react';

import { api } from '../../services/api';

const emptyForm = {
  patient: '',
  medicineName: '',
  dosage: '',
  frequency: '',
  duration: '',
  startDate: '',
  endDate: '',
  instructions: '',
};

export default function Prescriptions() {
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [patientsResponse, medicinesResponse] = await Promise.all([
        api.get('/patients'),
        api.get('/medicines/doctor'),
      ]);

      const patientList = Array.isArray(patientsResponse)
        ? patientsResponse
        : patientsResponse?.patients || [];

      const medicineList = Array.isArray(medicinesResponse?.medicines)
        ? medicinesResponse.medicines
        : [];

      setPatients(patientList);
      setMedicines(medicineList);
    } catch (requestError) {
      console.error('Prescription load error:', requestError);
      setError(requestError.message || 'Failed to load patient and prescription data.');
    } finally {
      setLoading(false);
    }
  };

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
      await api.post('/medicines', form);
      setMessage('Prescription created successfully.');
      setForm(emptyForm);
      await loadData();
    } catch (requestError) {
      setError(requestError.message || 'Failed to create prescription.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (medicineId, status) => {
    try {
      await api.patch(`/medicines/${medicineId}/status`, { status });
      setMedicines((current) =>
        current.map((item) =>
          item._id === medicineId ? { ...item, status } : item
        )
      );
      setMessage('Medication status updated.');
    } catch (requestError) {
      setError(requestError.message || 'Failed to update medication status.');
    }
  };

  if (loading) {
    return (
      <section className="page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">CLINIC MANAGEMENT</p>
            <h1>Prescriptions</h1>
          </div>
        </div>
        <div className="empty-state">
          <span>⏳</span>
          <h2>Loading prescriptions...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CLINIC MANAGEMENT</p>
          <h1>Prescriptions</h1>
          <p>Create and manage medication plans for your patients.</p>
        </div>
      </div>

      <form className="card form-card" onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <label>
            Patient
            <select name="patient" value={form.patient} onChange={handleChange} required>
              <option value="">Select patient</option>
              {patients.map((patient) => (
                <option key={patient._id} value={patient._id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Medicine name
            <input name="medicineName" value={form.medicineName} onChange={handleChange} placeholder="Amoxicillin" required />
          </label>

          <label>
            Dosage
            <input name="dosage" value={form.dosage} onChange={handleChange} placeholder="500 mg" required />
          </label>

          <label>
            Frequency
            <input name="frequency" value={form.frequency} onChange={handleChange} placeholder="Twice daily" required />
          </label>

          <label>
            Duration
            <input name="duration" value={form.duration} onChange={handleChange} placeholder="7 days" required />
          </label>

          <label>
            Start date
            <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
          </label>

          <label>
            End date
            <input name="endDate" type="date" value={form.endDate} onChange={handleChange} />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Instructions
            <textarea name="instructions" value={form.instructions} onChange={handleChange} rows="3" placeholder="Take after food, avoid dairy products." />
          </label>
        </div>

        {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}
        {message && <p className="form-success" style={{ marginTop: '1rem' }}>{message}</p>}

        <button className="btn btn-primary" type="submit" disabled={saving} style={{ marginTop: '1rem' }}>
          {saving ? 'Saving...' : 'Add prescription'}
        </button>
      </form>

      <div className="section-title">
        <h2>Current prescriptions</h2>
      </div>

      {medicines.length === 0 ? (
        <div className="empty-state">
          <span>💊</span>
          <h2>No prescriptions yet</h2>
          <p>Your issued medicines will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {medicines.map((medicine) => (
            <article key={medicine._id} className="card" style={{ padding: '1rem 1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: '0.25rem' }}>
                    {medicine.patient?.name || 'Patient'}
                  </p>
                  <h3 style={{ margin: 0 }}>{medicine.medicineName}</h3>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <span>Status</span>
                  <select
                    value={medicine.status || 'Active'}
                    onChange={(event) => updateStatus(medicine._id, event.target.value)}
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                <div><strong>Dosage</strong><p>{medicine.dosage}</p></div>
                <div><strong>Frequency</strong><p>{medicine.frequency}</p></div>
                <div><strong>Duration</strong><p>{medicine.duration}</p></div>
                <div><strong>Start date</strong><p>{medicine.startDate ? new Date(medicine.startDate).toLocaleDateString() : '-'}</p></div>
                {medicine.endDate && (
                  <div><strong>End date</strong><p>{new Date(medicine.endDate).toLocaleDateString()}</p></div>
                )}
              </div>

              {medicine.instructions && (
                <div style={{ marginTop: '0.85rem' }}>
                  <strong>Instructions</strong>
                  <p style={{ margin: '0.35rem 0 0' }}>{medicine.instructions}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
