export default function StudentListTable({ students, onReset }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="py-3 pr-4 text-sm font-medium text-ink">Nama</th>
            <th className="py-3 pr-4 text-sm font-medium text-ink">Username</th>
            <th className="py-3 pr-4 text-sm font-medium text-ink">Status</th>
            <th className="py-3 text-sm font-medium text-ink">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id} className="border-b border-hairline">
              <td className="py-3 pr-4 text-base text-ink">{student.fullName}</td>
              <td className="py-3 pr-4 font-mono text-sm text-ink/70">{student.username}</td>
              <td className="py-3 pr-4">
                <span
                  className={
                    student.isActive
                      ? 'text-sm font-medium text-ink'
                      : 'text-sm font-medium text-ink/50'
                  }
                >
                  {student.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td className="py-3">
                <button
                  type="button"
                  onClick={() => onReset(student)}
                  className="text-sm font-medium text-ink underline underline-offset-4 hover:text-ink/70 focus:outline-none focus:ring-2 focus:ring-ink rounded-sm"
                >
                  Reset Kata Sandi
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}