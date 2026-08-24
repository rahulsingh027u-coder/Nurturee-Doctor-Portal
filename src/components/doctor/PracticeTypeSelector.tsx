'use client';

import { useState } from 'react';
import { Stethoscope, Building2, Hospital, ChevronDown, Loader2, ArrowRight } from 'lucide-react';

const PRACTICE_TYPES = [
  { value: 'doctor', label: 'Doctor', subtitle: 'Individual Practitioner', icon: 'stethoscope', description: 'Solo practice, home visits, or consulting at multiple locations' },
  { value: 'clinic', label: 'Clinic', subtitle: 'Medical Center / Polyclinic', icon: 'building', description: 'Single or multi-specialty clinic with consulting rooms' },
  { value: 'hospital', label: 'Hospital', subtitle: 'Multi-Specialty Hospital', icon: 'hospital', description: 'Hospital with inpatient facilities and multiple departments' },
];

interface PracticeTypeSelectorProps {
  userId: string;
  doctorId: string;
  onComplete: (practiceType: string) => void;
}

export function PracticeTypeSelector({ userId, doctorId, onComplete }: PracticeTypeSelectorProps) {
  const [selected, setSelected] = useState('');
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedType = PRACTICE_TYPES.find((t) => t.value === selected);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'stethoscope': return <Stethoscope className="h-5 w-5" />;
      case 'building': return <Building2 className="h-5 w-5" />;
      case 'hospital': return <Hospital className="h-5 w-5" />;
      default: return <Stethoscope className="h-5 w-5" />;
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/doctor/practice-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, doctorId, practiceType: selected }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Failed to save'); }
      onComplete(selected);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-3">
              <Stethoscope className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Select Your Practice Type</h2>
            <p className="text-sm text-gray-500 mt-1">Tell us about your practice to personalize your experience</p>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Practice Type</label>
          <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${isOpen ? 'border-blue-500 bg-blue-50/50' : selected ? 'border-gray-300 bg-white hover:border-gray-400' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <div className="flex items-center gap-3">
                {selectedType ? (
                  <>
                    <span className="text-blue-600">{getIcon(selectedType.icon)}</span>
                    <div>
                      <span className="text-gray-900 font-medium text-sm">{selectedType.label}</span>
                      <span className="text-gray-400 text-xs ml-2">{selectedType.subtitle}</span>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">Choose your practice type</span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {PRACTICE_TYPES.map((type) => (
                  <button key={type.value} type="button" onClick={() => { setSelected(type.value); setIsOpen(false); setError(null); }} className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${selected === type.value ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <span className={`mt-0.5 ${selected === type.value ? 'text-blue-600' : 'text-gray-400'}`}>{getIcon(type.icon)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${selected === type.value ? 'text-blue-700' : 'text-gray-900'}`}>{type.label}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{type.subtitle}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                    </div>
                    {selected === type.value && (
                      <div className="mt-1 w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedType && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">{selectedType.description}</p>
            </div>
          )}
          {error && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <button onClick={handleSave} disabled={!selected || saving} className={`mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${selected && !saving ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {saving ? (<><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>) : (<>Continue <ArrowRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0" style={{ zIndex: 5 }} onClick={() => setIsOpen(false)} />}
    </div>
  );
}
