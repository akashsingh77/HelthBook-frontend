import { useState } from 'react';

import './pages/patient/PatientDashboard.css';
import './App.css';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

import PatientDashboard from './pages/patient/Dashboard';
import Doctors from './pages/patient/Doctors';
import AIAssistant from './pages/patient/AIAssistant';
import DoctorDetails from './pages/patient/DoctorDetails';
import MedicalRecords from './pages/patient/MedicalRecords';
import PatientPrescriptions from './pages/patient/Prescriptions';
import Reports from './pages/patient/Reports';
import HealthStats from './pages/patient/HealthStats';

import BookAppointment from './pages/appointments/BookAppointment';
import MyAppointments from './pages/appointments/MyAppointments';

import Medicines from './pages/medicines/Medicines';
import MedicineShop from './pages/medicines/MedicineShop';

import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorPatients from './pages/doctor/Patients';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorReviews from './pages/doctor/Reviews';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import EmergencyService from './pages/EmergencyService';

import AdminDashboard from './pages/admin/Dashboard';
import AdminDoctors from './pages/admin/Doctors';
import AdminPatients from './pages/admin/Patients';
import AdminAppointments from './pages/admin/Appointments';

import { api } from './services/api';


export default function App() {

  const [screen, setScreen] = useState('dashboard');

  const [role, setRole] = useState('patient');

  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);


  // ==========================================
  // NAVIGATION
  // ==========================================

  const goTo = (next) => {
    setScreen(next);
    setMenuOpen(false);
  };


  // ==========================================
  // HOME
  // ==========================================

  if (screen === 'home') {
    return (
      <Home
        onNavigate={goTo}
      />
    );
  }


  // ==========================================
  // LOGIN
  // ==========================================

  if (screen === 'login') {

    return (
      <Login
        onLogin={async (credentials) => {

          try {

            const data = await api.post(
              '/auth/login',
              credentials
            );

            localStorage.setItem(
              'healthbook_token',
              data.token
            );

            setRole(data.user.role);

            goTo('dashboard');

          } catch (error) {

            console.error(
              'Login failed:',
              error
            );

            alert(
              error?.message ||
              'Login failed'
            );
          }

        }}

        onNavigate={goTo}
      />
    );
  }


  // ==========================================
  // REGISTER
  // ==========================================

  if (screen === 'register') {

    return (
      <Register

        onRegister={async (credentials) => {

          try {

            const data = await api.post(
              '/auth/register',
              credentials
            );

            localStorage.setItem(
              'healthbook_token',
              data.token
            );

            setRole(data.user.role);

            goTo('dashboard');

          } catch (error) {

            console.error(
              'Registration failed:',
              error
            );

            alert(
              error?.message ||
              'Registration failed'
            );
          }

        }}

        onNavigate={goTo}
      />
    );
  }


  // ==========================================
  // PATIENT PAGES
  // ==========================================

  const patientPages = {

    dashboard: (
      <PatientDashboard
        onNavigate={goTo}
      />
    ),

    doctors: (
      <Doctors
        onNavigate={goTo}
        onDoctorSelect={doctor => { setSelectedDoctor(doctor); goTo('doctor details') }}
      />
    ),

    'doctor details': (
      <DoctorDetails
        onNavigate={goTo}
        doctor={selectedDoctor}
      />
    ),

    appointments: (
      <MyAppointments
        onNavigate={goTo}
      />
    ),

    chat: (
      <Chat
        role="patient"
      />
    ),

    'book appointment': (
      <BookAppointment
        onNavigate={goTo}
      />
    ),

    'medical records': (
      <MedicalRecords
        onNavigate={goTo}
      />
    ),

    prescriptions: (
      <PatientPrescriptions
        onNavigate={goTo}
      />
    ),

    // ========================================
    // MEDICINES
    // ========================================

    medicines: (
      <Medicines
        onNavigate={goTo}
      />
    ),

    shop: (
      <MedicineShop />
    ),

    reports: (
      <Reports
        onNavigate={goTo}
      />
    ),

    'health stats': (
      <HealthStats
        onNavigate={goTo}
      />
    ),

    assistant: (
      <AIAssistant
        onNavigate={goTo}
      />
    ),

    profile: (
      <Profile
        onNavigate={goTo}
      />
    ),

    emergency: (
      <EmergencyService role="patient" />
    )
  };


  // ==========================================
  // DOCTOR PAGES
  // ==========================================

  const doctorPages = {

    dashboard: (
      <DoctorDashboard
        onNavigate={goTo}
      />
    ),

    appointments: (
      <DoctorAppointments
        onNavigate={goTo}
      />
    ),

    chat: (
      <Chat
        role="doctor"
      />
    ),

    patients: (
      <DoctorPatients
        onNavigate={goTo}
      />
    ),

    prescriptions: (
      <DoctorPrescriptions
        onNavigate={goTo}
      />
    ),

    reviews: (
      <DoctorReviews />
    ),

    profile: (
      <Profile
        onNavigate={goTo}
      />
    ),

    emergency: (
      <EmergencyService role="doctor" />
    )
  };


  // ==========================================
  // ADMIN PAGES
  // ==========================================

  const adminPages = {

    dashboard: (
      <AdminDashboard
        onNavigate={goTo}
      />
    ),

    doctors: (
      <AdminDoctors
        onNavigate={goTo}
      />
    ),

    patients: (
      <AdminPatients
        onNavigate={goTo}
      />
    ),

    appointments: (
      <AdminAppointments
        onNavigate={goTo}
      />
    ),

    emergency: (
      <EmergencyService role="admin" />
    )
  };


  // ==========================================
  // SELECT CURRENT PAGE
  // ==========================================

  const currentPages =
    role === 'patient'
      ? patientPages
      : role === 'doctor'
      ? doctorPages
      : adminPages;


  const page =
    currentPages[screen] ||
    (
      <Placeholder
        title={screen
          .replace(/\b\w/g, (c) => c.toUpperCase())}
      />
    );


  // ==========================================
  // MAIN APPLICATION
  // ==========================================

  return (

    <div className="app-shell">

      <Navbar
        role={role}
        onMenu={() => setMenuOpen(!menuOpen)}
        onNavigate={goTo}
      />


      <div className="workspace">

        <Sidebar
          role={role}
          active={screen}
          onNavigate={goTo}
          open={menuOpen}
        />


        <main className="main">

          {page}

        </main>

      </div>

    </div>
  );
}


// ==========================================
// PLACEHOLDER
// ==========================================

function Placeholder({ title }) {

  return (

    <section className="page">

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            HealthBook workspace
          </p>

          <h1>
            {title}
          </h1>

          <p>
            This section is ready to connect
            to your API.
          </p>

        </div>

      </div>


      <div className="empty-state">

        <span>✦</span>

        <h2>
          {title} at a glance
        </h2>

        <p>
          Your secure health information
          will appear here.
        </p>

      </div>

    </section>
  );
}