const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Default initial database state
const INITIAL_DATA = {
  patients: [
    {
      id: 'P101',
      name: 'Rahul Sharma',
      age: 22,
      gender: 'Male',
      symptoms: 'Fever and general fatigue',
      level: 'Normal',
      vitals: { bp: '118/76', hr: 74, spo2: 99, temp: 99.4, gcs: 15 },
      assignedDoctor: 'Dr. Marcus Vance',
      assignedBed: null,
      registered: Date.now() - 38 * 60000,
      status: 'Waiting',
      notes: ['Mild dehydration noted', 'Prescribed oral fluids']
    },
    {
      id: 'P102',
      name: 'Sneha Patel',
      age: 28,
      gender: 'Female',
      symptoms: 'Acute chest discomfort & anxiety',
      level: 'High',
      vitals: { bp: '142/92', hr: 110, spo2: 96, temp: 98.6, gcs: 15 },
      assignedDoctor: 'Dr. Elena Rostova',
      assignedBed: 'Acute Bed 2',
      registered: Date.now() - 25 * 60000,
      status: 'Waiting',
      notes: ['ECG ordered', 'Troponin screening pending']
    },
    {
      id: 'P103',
      name: 'Amit Verma',
      age: 35,
      gender: 'Male',
      symptoms: 'Severe migraine & photosensitivity',
      level: 'Medium',
      vitals: { bp: '130/84', hr: 82, spo2: 98, temp: 98.4, gcs: 15 },
      assignedDoctor: null,
      assignedBed: null,
      registered: Date.now() - 19 * 60000,
      status: 'Waiting',
      notes: ['Dim light environment requested']
    },
    {
      id: 'P104',
      name: 'Rohan Mehra',
      age: 41,
      gender: 'Male',
      symptoms: 'Sudden dyspnea & cyanosis',
      level: 'Critical',
      vitals: { bp: '90/60', hr: 138, spo2: 84, temp: 101.2, gcs: 12 },
      assignedDoctor: 'Dr. Sarah Chen',
      assignedBed: 'Resuscitation 1',
      registered: Date.now() - 14 * 60000,
      status: 'In Treatment',
      treatmentStarted: Date.now() - 6 * 60000,
      notes: ['Oxygen therapy initiated via non-rebreather mask', 'IV line established']
    },
    {
      id: 'P105',
      name: 'Priya Nair',
      age: 30,
      gender: 'Female',
      symptoms: 'Superficial laceration on forearm',
      level: 'Normal',
      vitals: { bp: '115/75', hr: 68, spo2: 99, temp: 98.2, gcs: 15 },
      assignedDoctor: null,
      assignedBed: null,
      registered: Date.now() - 10 * 60000,
      status: 'Waiting',
      notes: ['Tetanus toxoid booster needed']
    },
    {
      id: 'P106',
      name: 'Arjun Kapoor',
      age: 54,
      gender: 'Male',
      symptoms: 'High grade fever with rigors',
      level: 'High',
      vitals: { bp: '136/88', hr: 104, spo2: 94, temp: 103.1, gcs: 14 },
      assignedDoctor: 'Dr. Rajesh Kumar',
      assignedBed: null,
      registered: Date.now() - 5 * 60000,
      status: 'Waiting',
      notes: ['Blood cultures drawn', 'Antipyretics administered']
    }
  ],
  doctors: [
    { id: 'DOC-1', name: 'Dr. Sarah Chen', specialty: 'Trauma & Critical Care', status: 'In Resuscitation', activePatient: 'P104', avatar: '🩺' },
    { id: 'DOC-2', name: 'Dr. Rajesh Kumar', specialty: 'Emergency Medicine', status: 'Available', activePatient: null, avatar: '👨‍⚕️' },
    { id: 'DOC-3', name: 'Dr. Elena Rostova', specialty: 'Cardiology', status: 'On Call', activePatient: null, avatar: '👩‍⚕️' },
    { id: 'DOC-4', name: 'Dr. Marcus Vance', specialty: 'General & Pediatric ER', status: 'Available', activePatient: null, avatar: '🧑‍⚕️' }
  ],
  beds: [
    { id: 'BAY-1', name: 'Resuscitation Bay 1', type: 'Critical', occupiedBy: 'P104', isAvailable: false },
    { id: 'BAY-2', name: 'Resuscitation Bay 2', type: 'Critical', occupiedBy: null, isAvailable: true },
    { id: 'BAY-3', name: 'Trauma Suite A', type: 'High', occupiedBy: null, isAvailable: true },
    { id: 'BAY-4', name: 'Acute Bed 1', type: 'Medium', occupiedBy: null, isAvailable: true },
    { id: 'BAY-5', name: 'Acute Bed 2', type: 'Medium', occupiedBy: null, isAvailable: true },
    { id: 'BAY-6', name: 'Observation Bay Alpha', type: 'Normal', occupiedBy: null, isAvailable: true }
  ],
  logs: [
    { id: 'L-1', time: Date.now() - 38 * 60000, text: 'System initialized. MediQueue v2.0 Operational.', type: 'info' },
    { id: 'L-2', time: Date.now() - 14 * 60000, text: 'CRITICAL ALERT: Patient P104 (Rohan Mehra) registered with dyspnea. Priority 1 assigned.', type: 'critical' },
    { id: 'L-3', time: Date.now() - 6 * 60000, text: 'P104 moved to Treatment Room (Resuscitation Bay 1 under Dr. Sarah Chen).', type: 'treatment' }
  ]
};

// Database persistence helpers
function initDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      console.log('Database initialized at:', DB_PATH);
    }
  } catch (err) {
    console.error('Error initializing DB:', err);
  }
}

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      initDb();
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, using initial data:', err);
    return JSON.parse(JSON.stringify(INITIAL_DATA));
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

initDb();

// Server-Sent Events (SSE) for Real-Time synchronization
const sseClients = new Set();

function broadcastEvent(eventType, payload) {
  const message = `event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

function logAction(db, text, type = 'info') {
  const entry = {
    id: 'L-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    time: Date.now(),
    text,
    type
  };
  db.logs.unshift(entry);
  if (db.logs.length > 50) db.logs.pop();
  return entry;
}

// SSE endpoint
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write(': connected\n\n');

  const client = { id: Date.now(), res };
  sseClients.add(client);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// System Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    uptime: process.uptime(),
    activeClients: sseClients.size
  });
});

// Priority ranking mapping
const PRIORITY_ORDER = { Critical: 1, High: 2, Medium: 3, Normal: 4 };

// Patients Endpoints
app.get('/api/patients', (req, res) => {
  const db = readDb();
  let list = db.patients;
  const { status, level, search } = req.query;

  if (status && status !== 'All') {
    list = list.filter(p => p.status === status);
  }
  if (level && level !== 'All') {
    list = list.filter(p => p.level === level);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.symptoms.toLowerCase().includes(q));
  }

  res.json(list);
});

app.get('/api/patients/:id', (req, res) => {
  const db = readDb();
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  res.json(patient);
});

app.post('/api/patients', (req, res) => {
  const { name, age, gender, symptoms, level, vitals, assignedDoctor, assignedBed } = req.body;
  if (!name || !age || !symptoms) {
    return res.status(400).json({ error: 'Name, age, and symptoms are required' });
  }

  const db = readDb();
  const maxNum = db.patients.reduce((max, p) => {
    const num = parseInt(p.id.replace(/\D/g, ''), 10) || 0;
    return num > max ? num : max;
  }, 100);

  const newId = 'P' + (maxNum + 1);
  const triageLevel = level || 'Normal';

  // Realistic default vitals if omitted
  const patientVitals = vitals || {
    bp: triageLevel === 'Critical' ? '85/55' : triageLevel === 'High' ? '145/95' : '120/80',
    hr: triageLevel === 'Critical' ? 132 : triageLevel === 'High' ? 106 : 76,
    spo2: triageLevel === 'Critical' ? 88 : triageLevel === 'High' ? 93 : 98,
    temp: 98.6,
    gcs: triageLevel === 'Critical' ? 11 : 15
  };

  const newPatient = {
    id: newId,
    name: name.trim(),
    age: Number(age),
    gender: gender || 'Other',
    symptoms: symptoms.trim(),
    level: triageLevel,
    vitals: patientVitals,
    assignedDoctor: assignedDoctor || null,
    assignedBed: assignedBed || null,
    registered: Date.now(),
    status: 'Waiting',
    notes: [`Admitted into triage queue at ${new Date().toLocaleTimeString()}`]
  };

  db.patients.push(newPatient);
  const log = logAction(db, `Admitted ${newPatient.name} (${newPatient.id}) as ${newPatient.level} priority.`, newPatient.level === 'Critical' ? 'critical' : 'info');

  writeDb(db);
  broadcastEvent('patient:created', { patient: newPatient, log });
  res.status(201).json(newPatient);
});

app.put('/api/patients/:id', (req, res) => {
  const db = readDb();
  const index = db.patients.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Patient not found' });

  const current = db.patients[index];
  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    registered: current.registered
  };

  db.patients[index] = updated;
  const log = logAction(db, `Updated record for ${updated.name} (${updated.id}).`, 'info');
  writeDb(db);

  broadcastEvent('patient:updated', { patient: updated, log });
  res.json(updated);
});

// Treat Next or Specific Patient
app.post('/api/patients/:id/treat', (req, res) => {
  const db = readDb();
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Check if someone else is currently in treatment
  const alreadyInTreatment = db.patients.find(p => p.status === 'In Treatment' && p.id !== patient.id);
  if (alreadyInTreatment && !req.body.force) {
    return res.status(409).json({
      error: 'Treatment room currently occupied by ' + alreadyInTreatment.name,
      currentOccupant: alreadyInTreatment
    });
  }

  // Find or assign doctor & bed
  const availableDoctor = db.doctors.find(d => d.status === 'Available') || db.doctors[0];
  const availableBed = db.beds.find(b => b.isAvailable) || db.beds[0];

  patient.status = 'In Treatment';
  patient.treatmentStarted = Date.now();
  patient.assignedDoctor = req.body.doctorId ? (db.doctors.find(d => d.id === req.body.doctorId)?.name || patient.assignedDoctor) : (patient.assignedDoctor || availableDoctor?.name);
  patient.assignedBed = req.body.bedId ? (db.beds.find(b => b.id === req.body.bedId)?.name || patient.assignedBed) : (patient.assignedBed || availableBed?.name);
  patient.notes = patient.notes || [];
  patient.notes.push(`Treatment commenced at ${new Date().toLocaleTimeString()} by ${patient.assignedDoctor || 'ER Team'}`);

  // Update bed occupancy
  if (patient.assignedBed) {
    const bed = db.beds.find(b => b.name === patient.assignedBed);
    if (bed) {
      bed.isAvailable = false;
      bed.occupiedBy = patient.id;
    }
  }

  // Update doctor status
  if (patient.assignedDoctor) {
    const doc = db.doctors.find(d => d.name === patient.assignedDoctor);
    if (doc) {
      doc.status = 'In Treatment';
      doc.activePatient = patient.id;
    }
  }

  const log = logAction(db, `Patient ${patient.name} (${patient.id}) moved to Treatment Room under ${patient.assignedDoctor || 'ER Team'}.`, 'treatment');
  writeDb(db);

  broadcastEvent('patient:treated', { patient, log, doctors: db.doctors, beds: db.beds });
  res.json(patient);
});

// Complete Treatment
app.post('/api/patients/:id/complete', (req, res) => {
  const db = readDb();
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  patient.status = 'Treated';
  patient.completed = Date.now();
  patient.notes = patient.notes || [];
  patient.notes.push(`Treatment successfully completed at ${new Date().toLocaleTimeString()}`);

  // Free the bed
  if (patient.assignedBed) {
    const bed = db.beds.find(b => b.name === patient.assignedBed || b.occupiedBy === patient.id);
    if (bed) {
      bed.isAvailable = true;
      bed.occupiedBy = null;
    }
  }

  // Free the doctor
  if (patient.assignedDoctor) {
    const doc = db.doctors.find(d => d.name === patient.assignedDoctor || d.activePatient === patient.id);
    if (doc) {
      doc.status = 'Available';
      doc.activePatient = null;
    }
  }

  const log = logAction(db, `Treatment completed for ${patient.name} (${patient.id}). Discharged to recovery.`, 'info');
  writeDb(db);

  broadcastEvent('patient:completed', { patient, log, doctors: db.doctors, beds: db.beds });
  res.json(patient);
});

// Re-triage Patient Level
app.post('/api/patients/:id/retriage', (req, res) => {
  const { level } = req.body;
  if (!PRIORITY_ORDER[level]) {
    return res.status(400).json({ error: 'Invalid priority level' });
  }

  const db = readDb();
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const oldLevel = patient.level;
  patient.level = level;
  patient.notes = patient.notes || [];
  patient.notes.push(`Triage re-evaluated from ${oldLevel} to ${level} at ${new Date().toLocaleTimeString()}`);

  const log = logAction(db, `Re-triaged ${patient.name} (${patient.id}): ${oldLevel} ➔ ${level}.`, level === 'Critical' ? 'critical' : 'info');
  writeDb(db);

  broadcastEvent('patient:retriaged', { patient, log });
  res.json(patient);
});

// Delete or Discharge Patient
app.delete('/api/patients/:id', (req, res) => {
  const db = readDb();
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  patient.status = 'Removed';
  patient.removedAt = Date.now();

  // Free resources if occupied
  const bed = db.beds.find(b => b.occupiedBy === patient.id);
  if (bed) {
    bed.isAvailable = true;
    bed.occupiedBy = null;
  }
  const doc = db.doctors.find(d => d.activePatient === patient.id);
  if (doc) {
    doc.status = 'Available';
    doc.activePatient = null;
  }

  const log = logAction(db, `Patient record ${patient.id} (${patient.name}) removed from active care.`, 'warning');
  writeDb(db);

  broadcastEvent('patient:removed', { patientId: patient.id, log, beds: db.beds, doctors: db.doctors });
  res.json({ success: true, id: patient.id });
});

// Simulation: Code Red Emergency
app.post('/api/emergency-simulate', (req, res) => {
  const db = readDb();
  const maxNum = db.patients.reduce((max, p) => {
    const num = parseInt(p.id.replace(/\D/g, ''), 10) || 0;
    return num > max ? num : max;
  }, 100);

  const emergencyScenarios = [
    { name: 'Vikram Sengupta', age: 49, gender: 'Male', symptoms: 'Severe poly-trauma following highway collision; arterial bleed', level: 'Critical', vitals: { bp: '78/48', hr: 145, spo2: 81, temp: 97.4, gcs: 8 } },
    { name: 'Dr. Ananya Roy', age: 39, gender: 'Female', symptoms: 'Anaphylactic shock following medication; severe stridor', level: 'Critical', vitals: { bp: '82/50', hr: 138, spo2: 85, temp: 98.9, gcs: 11 } },
    { name: 'Kabir Singhania', age: 62, gender: 'Male', symptoms: 'Acute STEMI myocardial infarction; crushing substernal chest pain', level: 'Critical', vitals: { bp: '160/100', hr: 124, spo2: 91, temp: 98.2, gcs: 14 } }
  ];

  const chosen = emergencyScenarios[Math.floor(Math.random() * emergencyScenarios.length)];
  const newId = 'P' + (maxNum + 1);

  const newPatient = {
    id: newId,
    name: chosen.name,
    age: chosen.age,
    gender: chosen.gender,
    symptoms: chosen.symptoms,
    level: chosen.level,
    vitals: chosen.vitals,
    assignedDoctor: 'Dr. Sarah Chen',
    assignedBed: 'Resuscitation Bay 2',
    registered: Date.now(),
    status: 'Waiting',
    notes: ['🚨 INCOMING AMBULANCE TRAUMA CODE RED 🚨', 'Automated Priority 1 preemption']
  };

  db.patients.push(newPatient);
  const log = logAction(db, `🚨 CODE RED SIMULATION: ${newPatient.name} (${newPatient.id}) incoming! Triage Level 1: CRITICAL`, 'critical');

  writeDb(db);
  broadcastEvent('patient:created', { patient: newPatient, log, isEmergency: true });
  res.status(201).json(newPatient);
});

// Doctors & Beds
app.get('/api/doctors', (req, res) => {
  const db = readDb();
  res.json(db.doctors);
});

app.get('/api/beds', (req, res) => {
  const db = readDb();
  res.json(db.beds);
});

app.get('/api/logs', (req, res) => {
  const db = readDb();
  res.json(db.logs);
});

// Comprehensive Stats
app.get('/api/stats', (req, res) => {
  const db = readDb();
  const waiting = db.patients.filter(p => p.status === 'Waiting');
  const critical = waiting.filter(p => p.level === 'Critical').length;
  const high = waiting.filter(p => p.level === 'High').length;
  const inTreatment = db.patients.filter(p => p.status === 'In Treatment').length;
  const treated = db.patients.filter(p => p.status === 'Treated').length;

  const now = Date.now();
  const totalWaitMs = waiting.reduce((acc, p) => acc + (now - p.registered), 0);
  const avgWaitMinutes = waiting.length ? Math.round(totalWaitMs / waiting.length / 60000) : 0;

  const bedsOccupied = db.beds.filter(b => !b.isAvailable).length;
  const bedOccupancyRate = Math.round((bedsOccupied / db.beds.length) * 100);

  res.json({
    total: db.patients.length,
    waiting: waiting.length,
    critical,
    high,
    inTreatment,
    treated,
    avgWaitMinutes,
    bedsTotal: db.beds.length,
    bedsOccupied,
    bedOccupancyRate,
    doctorsOnDuty: db.doctors.filter(d => d.status !== 'Off Duty').length
  });
});

// Reset Database
app.post('/api/reset', (req, res) => {
  writeDb(INITIAL_DATA);
  const db = readDb();
  const log = logAction(db, 'Hospital system records reset to baseline demo state.', 'info');
  writeDb(db);
  broadcastEvent('system:reset', { log });
  res.json({ success: true, message: 'Database reset successfully' });
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🏥 MediQueue Server active at http://localhost:${PORT}`);
  console.log(`📡 SSE Stream ready at http://localhost:${PORT}/api/events`);
  console.log(`===============================================`);
});
