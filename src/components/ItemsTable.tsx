import type { Item } from '../types/invoice';
import { formatCurrency } from '../lib/formatters';
import { lineTotal } from '../lib/calculations';

type ItemsTableProps = {
  items: Item[];
  onChange: (items: Item[]) => void;
};

const emptyLine: Item = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  discountPct: 0,
};

export function ItemsTable({ items, onChange }: ItemsTableProps) {
  const updateItem = (index: number, patch: Partial<Item>) => {
    const next = items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, { ...emptyLine }]);
  };

  return (
    <div className="rounded-lg border border-[#E0E0E0] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#404040]">Lignes</h3>
        <button
          type="button"
          onClick={addItem}
          className="rounded-md border border-[#B9CC92] bg-[#C8D8A8] px-2 py-1 text-sm font-medium text-[#202020] hover:bg-[#B9CC92]"
        >
          + Ajouter ligne
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[#D8D8D8] bg-[#F0F8F0] text-left">
              <th className="pb-2 pr-2">Désignation</th>
              <th className="pb-2 pr-2">Qté</th>
              <th className="pb-2 pr-2">PU (€)</th>
              <th className="pb-2 pr-2">Remise (%)</th>
              <th className="pb-2 pr-2">Total</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-[#F0F0F0] align-top">
                <td className="py-2 pr-2">
                  <input
                    value={item.description}
                    onChange={(event) => updateItem(index, { description: event.target.value })}
                    className="w-full rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
                    required
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                    className="w-20 rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unitPrice}
                    onChange={(event) => updateItem(index, { unitPrice: Number(event.target.value) })}
                    className="w-28 rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    value={item.discountPct || 0}
                    onChange={(event) => updateItem(index, { discountPct: Number(event.target.value) })}
                    className="w-24 rounded-md border border-[#E0E0E0] bg-white px-2 py-1"
                  />
                </td>
                <td className="py-2 pr-2 font-medium">{formatCurrency(lineTotal(item))}</td>
                <td className="py-2">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="rounded-md border border-[#E0E0E0] px-2 py-1 text-[#202020] hover:bg-[#F8F8F8]"
                    disabled={items.length === 1}
                  >
                    Suppr.
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
