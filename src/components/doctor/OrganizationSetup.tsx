'use client';

import { useState } from 'react';
import { Building2, MapPin, Settings, ChevronRight, ChevronLeft, Loader2, Hospital, Check } from 'lucide-react';

const SPECIALTIES = ['General Medicine','Cardiology','Orthopedics','Pediatrics','Gynecology','Dermatology','ENT','Ophthalmology','Dental','Neurology','Urology','Psychiatry','Radiology','Pathology','Physiotherapy','Ayurveda'];

const FACILITIES = ['Laboratory','Pharmacy','X-Ray','Ultrasound','ECG','MRI','CT Scan','ICU','OT','Blood Bank','Ambulance','WiFi','Parking','Cafeteria','Emergency'];

interface Props {
  userId: string;
  doctorId: string;
  practiceType: string;
  onComplete: () => void;
  onBack?: () => void;
}

export function OrganizationSetup({ userId, doctorId, practiceType, onComplete, onBack }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isHospital = practiceType === 'hospital';
  const label = isHospital ? 'Hospital' : 'Clinic';

  const [form, setForm] = useState({
    name: '', registrationNo: '', phone: '', email: '', website: '', description: '',
    address: '', city: '', state: '', pincode: '',
    department: '', specialization: '', degree: '',
    specialties: [] as string[], facilities: [] as string[],
    operatingHours: {} as Record<string, string>,
    bedCapacity: isHospital ? 0 : 0, emergency24x7: false,
  });

  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

  const toggleItem = (key: 'specialties' | 'facilities', item: string) => {
    const arr = form[key];
    set(key, arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  const STEPS = [
    { title: 'Basic Information', icon: Building2 },
    { title: 'Location & Contact', icon: MapPin },
    { title: 'Facilities & Services', icon: Settings },
  ];

  const canNext = () => {
    if (step === 0) return form.name.trim() !== '' && form.phone.trim() !== '';
    if (step === 1) return form.city.trim() !== '';
    return true;
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/doctor/organization-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, doctorId, practiceType, ...form }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      onComplete();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const handleBack = () => {
    if (step === 0 && onBack) { onBack(); return; }
    setStep(s => s - 1);
  };

  const inputClass =  'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Stepper */}
          <div className="flex border-b border-gray-100">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === step; const done = i < step;
              return (
                <div key={i} className={`flex-1 flex items-center gap-2 px-4 py-3 text-xs font-medium cursor-pointer transition ${active ? 'text-blue-600 bg-blue-50' : done ? 'text-green-600' : 'text-gray-400'}`} onClick={() => { if (done || i === step + 1 && canNext()) setStep(i); }}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{s.title}</span>
                  {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 ml-auto text-gray-300" />}
                </div>
              );
            })}
          </div>

          <div className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-2">
                    {isHospital ? <Hospital className="h-6 w-6 text-blue-600" /> : <Building2 className="h-6 w-6 text-blue-600" />}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">{label} Registration</h2>
                  <p className="text-xs text-gray-500">Step 1 of 3</p>
                </div>
                <div><label className={labelClass}>{label} Name *</label><input className={inputClass} placeholder={`Enter ${label.toLowerCase()} name`} value={form.name} onChange={e => set('name', e.target.value)} /></div>
                <div><label className={labelClass}>Registration Number</label><input className={inputClass} placeholder="e.g. DLH/REG/2024/001" value={form.registrationNo} onChange={e => set('registrationNo', e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelClass}>Phone *</label><input className={inputClass} placeholder="Contact number" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                  <div><label className={labelClass}>Email</label><input className={inputClass} type="email" placeholder="Email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
                </div>
                <div><label className={labelClass}>Website</label><input className={inputClass} placeholder="https://..." value={form.website} onChange={e => set('website', e.target.value)} /></div>
                <div><label className={labelClass}>Description</label><textarea className={inputClass + ' h-20 resize-none'} placeholder={`Brief about your ${label.toLowerCase()}`} value={form.description} onChange={e => set('description', e.target.value)} /></div>
                {isHospital && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelClass}>Bed Capacity</label><input className={inputClass} type="number" placeholder="0" value={form.bedCapacity} onChange={e => set('bedCapacity', parseInt(e.target.value) || 0)} /></div>
                    <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={form.emergency24x7} onChange={e => set('emergency24x7', e.target.checked)} /><span className="text-sm text-gray-700">24/7 Emergency</span></label></div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-2"><MapPin className="h-6 w-6 text-blue-600" /></div>
                  <h2 className="text-lg font-bold text-gray-900">Location & Contact</h2>
                  <p className="text-xs text-gray-500">Step 2 of 3</p>
                </div>
                <div><label className={labelClass}>Address</label><input className={inputClass} placeholder="Street address" value={form.address} onChange={e => set('address', e.target.value)} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelClass}>City *</label><input className={inputClass} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} /></div>
                  <div><label className={labelClass}>State</label><input className={inputClass} placeholder="State" value={form.state} onChange={e => set('state', e.target.value)} /></div>
                  <div><label className={labelClass}>Pincode</label><input className={inputClass} placeholder="Pincode" value={form.pincode} onChange={e => set('pincode', e.target.value)} /></div>
                </div>
                <div><label className={labelClass}>Primary Department / Specialization</label><input className={inputClass} placeholder="e.g. Multi-specialty, Cardiology Center" value={form.department} onChange={e => set('department', e.target.value)} /></div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-2"><Settings className="h-6 w-6 text-blue-600" /></div>
                  <h2 className="text-lg font-bold text-gray-900">Facilities & Services</h2>
                  <p className="text-xs text-gray-500">Step 3 of 3</p>
                </div>
                <div>
                  <label className={labelClass}>Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map(s => (
                      <button key={s} type="button" onClick={() => toggleItem('specialties', s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${form.specialties.includes(s) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Facilities</label>
                  <div className="flex flex-wrap gap-2">
                    {FACILITIES.map(f => (
                      <button key={f} type="button" onClick={() => toggleItem('facilities', f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${form.facilities.includes(f) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{f}</button>
                    ))}
                  </div>
                </div>
                {error && <div className="p-3 bg-red-50 rounded-lg border border-red-100"><p className="text-sm text-red-600">{error}</p></div>}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {(step > 0 || onBack) && (
                <button onClick={handleBack} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"><ChevronLeft className="h-4 w-4" /> Back</button>
              )}
              {step < 2 ? (
                <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${canNext() ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Next <ChevronRight className="h-4 w-4" /></button>
              ) : (
                <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:bg-gray-100 disabled:text-gray-400">
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
