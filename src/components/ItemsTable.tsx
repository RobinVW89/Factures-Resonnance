import type { Item } from '../types/invoice';
import { formatAmount } from '../lib/formatters';

interface Props {
  items: Item[];
  onChange: (items: Item[]) => void;
}

export default function ItemsTable({ items, onChange }: Props) {
  const inputClass = "w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";

  const updateItem = (idx: number, field: keyof Item, val: string | number | undefined) => {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: val } : item);
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const lineTotal = (item: Item) => {
    const discount = item.discountPct ?? 0;
    return item.quantity * item.unitPrice * (1 - discount / 100);
  };

  return (
    <div className="mb-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-blue-800 text-white">
              <th className="px-2 py-2 text-left font-medium">Désignation</th>
              <th className="px-2 py-2 text-right font-medium w-20">Qté</th>
              <th className="px-2 py-2 text-right font-medium w-28">Prix unit.</th>
              <th className="px-2 py-2 text-right font-medium w-20">Remise %</th>
              <th className="px-2 py-2 text-right font-medium w-28">Total</th>
              <th className="px-2 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}>
                <td className="px-2 py-1">
                  <input
                    className={inputClass}
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    placeholder="Description..."
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className={`${inputClass} text-right`}
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className={`${inputClass} text-right`}
                    value={item.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className={`${inputClass} text-right`}
                    value={item.discountPct ?? ''}
                    placeholder="0"
                    onChange={e => {
                      const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                      updateItem(idx, 'discountPct', v);
                    }}
                  />
                </td>
                <td className="px-2 py-1 text-right text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                  {formatAmount(lineTotal(item))}
                </td>
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-lg leading-none"
                    title="Supprimer"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
      >
        + Ajouter une ligne
      </button>
    </div>
  );
}
