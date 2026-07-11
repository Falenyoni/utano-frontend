const REPORT_CATEGORIES = [
  {
    title: 'Financial Reports',
    icon: '💰',
    reports: [
      { name: 'Revenue Summary', description: 'Total revenue by period, payment method breakdown' },
      { name: 'Outstanding Balances', description: 'Unpaid and overdue invoices by patient' },
      { name: 'Payment Plan Status', description: 'Active payment plans and installment performance' },
      { name: 'Medical Aid Claims', description: 'Claims submitted, approved, and rejected by provider' },
    ],
  },
  {
    title: 'Clinical Reports',
    icon: '📋',
    reports: [
      { name: 'Consultations by Doctor', description: 'Visit counts and types per clinician' },
      { name: 'Diagnoses Summary', description: 'Most common diagnoses over a selected period' },
      { name: 'Visit Duration Analytics', description: 'Average consultation times by doctor and specialty' },
    ],
  },
  {
    title: 'Patient Reports',
    icon: '👤',
    reports: [
      { name: 'New Registrations', description: 'New patients registered over time' },
      { name: 'Patient Demographics', description: 'Age distribution, gender, and location breakdown' },
      { name: 'Chronic Conditions', description: 'Patients with chronic conditions tracked in the system' },
    ],
  },
  {
    title: 'Operational Reports',
    icon: '📊',
    reports: [
      { name: 'Appointment Utilisation', description: 'Booking rate, cancellations, no-shows by period' },
      { name: 'Waiting Room Flow', description: 'Average wait times and throughput per day' },
      { name: 'Inventory Valuation', description: 'Stock on hand value, movement and wastage summary' },
      { name: 'Low Stock Alert', description: 'Items currently below reorder level' },
    ],
  },
]

export function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate reports once all modules are fully operational.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORT_CATEGORIES.map((cat) => (
          <div key={cat.title} className="bg-white border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2">
              <span className="text-lg">{cat.icon}</span>
              <h2 className="font-semibold text-gray-800">{cat.title}</h2>
            </div>
            <ul className="divide-y">
              {cat.reports.map((r) => (
                <li key={r.name} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full whitespace-nowrap mt-0.5">
                    Coming soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
