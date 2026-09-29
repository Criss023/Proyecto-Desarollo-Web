// src/components/StatsBadge.tsx
interface StatsBadgeProps {
  label: string;
  value: number;
  variant?: 'blue' | 'green' | 'yellow' | 'red';
}

const variantConfig = {
  blue: { border: 'border-blue-600', text: 'text-blue-600' },
  green: { border: 'border-green-600', text: 'text-green-600' },
  yellow: { border: 'border-yellow-600', text: 'text-yellow-600' },
  red: { border: 'border-red-500', text: 'text-red-500' },
};

function StatsBadge({ label, value, variant = 'blue' }: StatsBadgeProps) {
  const style = variantConfig[variant];

  return (
    <div className={`flex flex-col items-center px-5 py-3 rounded-lg bg-white border min-w-[120px] ${style.border}`}>
      <span className={`text-2xl font-bold ${style.text}`}>{value}</span>
      <span className="text-sm text-slate-500">{label}</span>
    </div>
  );
}

export default StatsBadge;
