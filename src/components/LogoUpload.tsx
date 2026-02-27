import { useRef } from 'react';

interface Props {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export default function LogoUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      {value && (
        <img src={value} alt="Logo" className="h-12 w-auto object-contain border rounded" />
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
      >
        {value ? 'Changer le logo' : 'Ajouter un logo'}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange(undefined)}
          className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
        >
          Supprimer
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFile} />
    </div>
  );
}
