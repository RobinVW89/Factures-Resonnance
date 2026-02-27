import type { Item } from '../types/invoice';
import { formatCurrency } from '../lib/formatters';

interface Props {
  items: Item[];
  onChange: (items: Item[]) => void;
}

const defaultItem = (): Item => ({ description: '', quantity: 1, unitPrice: 0 });

export default function ItemsTable({ items, onChange }: Props) {
  const update = (i: number, field: keyof Item, value: string | number) => {
    const next = items.map((item, idx) =>
      idx === i ? { ...item, [field]: typeof value === 'string' && field !== 'description' ? parseFloat(value) || 0 : value } : item
    );
    onChange(next);
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, defaultItem()]);

  const lineTotal = (item: Item) => {
    const disc = item.discountPct ?? 0;
    return Math.round(item.quantity * item.unitPrice * (1 - disc / 100) * 100) / 100;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-blue-900 text-white">
            <th className="text-left px-3 py-2">Désignation</th>
            <th className="text-right px-3 py-2 w-20">Qté</th>
            <th className="text-right px-3 py-2 w-32">PU (€)</th>
            <th className="text-right px-3 py-2 w-24">Remise %</th>
            <th className="text-right px-3 py-2 w-32">Total (€)</th>
            <th className="px-3 py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
              <td className="px-2 py-1">
                <input
                  type="text"
                  value={item.description}
                  onChange={e => update(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-gray-100"
                  aria-label={`Désignation ligne ${i + 1}`}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={e => update(i, 'quantity', e.target.value)}
                  className="w-full text-right bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-gray-100"
                  aria-label={`Quantité ligne ${i + 1}`}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => update(i, 'unitPrice', e.target.value)}
                  className="w-full text-right bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-gray-100"
                  aria-label={`Prix unitaire ligne ${i + 1}`}
                />
              </td>
              <td className="px-2 py-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={item.discountPct ?? ''}
                  onChange={e => update(i, 'discountPct', e.target.value)}
                  placeholder="0"
                  className="w-full text-right bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:text-gray-100"
                  aria-label={`Remise ligne ${i + 1}`}
                />
              </td>
              <td className="px-2 py-1 text-right font-medium dark:text-gray-100">
                {formatCurrency(lineTotal(item))}
              </td>
              <td className="px-2 py-1 text-center">
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-red-500 hover:text-red-700 font-bold"
                  aria-label={`Supprimer ligne ${i + 1}`}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={add}
        className="mt-2 px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm transition-colors"
      >
        + Ajouter une ligne
      </button>
    </div>
  );
}
