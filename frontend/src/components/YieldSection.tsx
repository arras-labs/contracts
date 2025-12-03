import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Property } from "../types";

interface YieldSectionProps {
  property: Property;
  userTokens?: number;
}

export const YieldSection = ({
  property,
  userTokens = 0,
}: YieldSectionProps) => {
  const estimatedYield = Number(property.estimatedAnnualYield) / 100; // Converti da centesimi a percentuale
  const totalValueUSD = Number(property.totalValueUSD);
  const tokenPrice = 50;
  const userInvestment = userTokens * tokenPrice;

  // Proiezione rendimento a 5 anni
  const projectionData = Array.from({ length: 5 }, (_, i) => {
    const year = i + 1;
    const annualReturn = userInvestment * (estimatedYield / 100);
    const cumulativeReturn = annualReturn * year;
    return {
      year: `Anno ${year}`,
      rendimento: parseFloat(annualReturn.toFixed(2)),
      cumulativo: parseFloat(cumulativeReturn.toFixed(2)),
    };
  });

  // Distribuzione investimento
  const distributionData = [
    { name: "Tuo Investimento", value: userInvestment },
    { name: "Altri Investitori", value: totalValueUSD - userInvestment },
  ];

  // Metriche mensili simulate
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    mese: [
      "Gen",
      "Feb",
      "Mar",
      "Apr",
      "Mag",
      "Giu",
      "Lug",
      "Ago",
      "Set",
      "Ott",
      "Nov",
      "Dic",
    ][i],
    rendimento: parseFloat(
      ((userInvestment * (estimatedYield / 100)) / 12).toFixed(2)
    ),
  }));

  const COLORS = ["#3B82F6", "#E5E7EB"];

  return (
    <div className="space-y-6">
      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">
            Rendimento Annuale Stimato
          </div>
          <div className="text-3xl font-bold">{estimatedYield}%</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">Tuo Investimento</div>
          <div className="text-3xl font-bold">
            ${userInvestment.toLocaleString()}
          </div>
          <div className="text-xs opacity-75 mt-1">{userTokens} token</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">
            Rendimento Annuale Stim.
          </div>
          <div className="text-3xl font-bold">
            ${((userInvestment * estimatedYield) / 100).toFixed(0)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-2">
            Rendimento Mensile Stim.
          </div>
          <div className="text-3xl font-bold">
            ${((userInvestment * estimatedYield) / 100 / 12).toFixed(0)}
          </div>
        </div>
      </div>

      {/* Grafici */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proiezione a 5 anni */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📈 Proiezione Rendimento 5 Anni
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="rendimento"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Rendimento Annuale"
              />
              <Line
                type="monotone"
                dataKey="cumulativo"
                stroke="#10B981"
                strokeWidth={2}
                name="Rendimento Cumulativo"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Distribuzione investimento */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            🥧 Distribuzione Pool
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name}: ${(percent * 100).toFixed(1)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Rendimento mensile */}
        <div className="bg-white rounded-xl shadow-lg p-6 lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📊 Rendimento Mensile Stimato
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mese" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Legend />
              <Bar
                dataKey="rendimento"
                fill="#3B82F6"
                name="Rendimento Mensile"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Note informative */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> I rendimenti mostrati sono stime basate su
              dati storici e proiezioni. I rendimenti effettivi possono variare
              in base alle condizioni di mercato, occupazione e spese di
              gestione. Gli investimenti immobiliari comportano rischi e non
              garantiscono profitti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
