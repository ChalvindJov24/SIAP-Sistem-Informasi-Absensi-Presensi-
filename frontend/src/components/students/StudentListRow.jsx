export default function StudentListRow({ student, onReset, onDeactivate }) {
  const { fullName, username, role, isActive } = student;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-4">
      {/* Nama Lengkap */}
      <span className="font-body text-sm sm:w-40 flex-shrink-0 font-medium text-ink truncate">
        {fullName}
      </span>

      {/* Username */}
      <span className="font-mono text-sm text-ink/60 sm:w-40 flex-shrink-0 truncate">
        {username}
      </span>

      {/* Role */}
      <span className="font-mono text-xs uppercase text-ink/60 sm:w-24 flex-shrink-0">
        {role}
      </span>

      {/* Badge Status */}
      <span
        className={
          isActive
            ? 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-block-sage text-block-sage-ink w-fit sm:w-20 text-center flex-shrink-0'
            : 'inline-block px-3 py-1 rounded-pill text-xs font-mono uppercase bg-surface-soft text-ink w-fit sm:w-20 text-center flex-shrink-0'
        }
      >
        {isActive ? 'Aktif' : 'Nonaktif'}
      </span>

      {/* Tombol Aksi */}
      <div className="flex gap-4 sm:ml-auto flex-wrap items-center pt-2 sm:pt-0">
        <button
          type="button"
          onClick={() => onReset(student)}
          className="text-sm underline text-ink hover:text-ink/70 focus:outline-none focus:ring-2 focus:ring-ink rounded-sm w-fit"
        >
          Reset Kata Sandi
        </button>

        {isActive && (
          <button
            type="button"
            onClick={() => onDeactivate(student)}
            className="text-sm underline text-ink hover:text-ink/70 focus:outline-none focus:ring-2 focus:ring-ink rounded-sm w-fit"
          >
            Nonaktifkan
          </button>
        )}
      </div>
    </div>
  );
}
