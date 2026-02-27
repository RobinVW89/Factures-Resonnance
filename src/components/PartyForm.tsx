import type { Party } from '../types/invoice';

interface Props {
  label: string;
  value: Party;
  onChange: (party: Party) => void;
}

export default function PartyForm({ label, value, onChange }: Props) {
  const update = (field: keyof Party, val: string) => onChange({ ...value, [field]: val });

  const inputClass = "w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

  return (
    <fieldset className="border border-gray-200 dark:border-gray-700 rounded p-4 mb-4">
      <legend className="text-sm font-semibold text-blue-700 dark:text-blue-400 px-2">{label}</legend>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={labelClass}>Nom *</label>
          <input className={inputClass} value={value.name} onChange={e => update('name', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Slogan / Activité</label>
          <input className={inputClass} value={value.tagline ?? ''} onChange={e => update('tagline', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Adresse *</label>
          <textarea className={inputClass} rows={3} value={value.address} onChange={e => update('address', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={value.email ?? ''} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Téléphone</label>
            <input type="tel" className={inputClass} value={value.phone ?? ''} onChange={e => update('phone', e.target.value)} />
          </div>
        </div>
        <div>
          <label className={labelClass}>SIREN / SIRET</label>
          <input className={inputClass} value={value.sirenOrSiret ?? ''} onChange={e => update('sirenOrSiret', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Mentions légales</label>
          <textarea className={inputClass} rows={2} value={value.legalMentions ?? ''} onChange={e => update('legalMentions', e.target.value)} />
        </div>
      </div>
    </fieldset>
  );
}
