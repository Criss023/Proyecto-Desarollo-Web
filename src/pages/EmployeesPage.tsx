import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { employeeService } from "../services/employeeService";
import type { EmployeeFilters } from "../services/employeeService";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  SUSPENDED: "Suspendido",
  RETIRED: "Retirado",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "badge-green",
  INACTIVE: "badge-gray",
  SUSPENDED: "badge-yellow",
  RETIRED: "badge-gray",
};

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED", "RETIRED"];
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  dpi: "",
  firstName: "",
  middleName: "",
  lastName: "",
  secondLastName: "",
  birthDate: "",
  address: "",
  phone: "",
  email: "",
  baseSalary: "",
  hireDate: "",
  departmentId: "",
  positionId: "",
  userId: "",
};

function validateForm(form: typeof EMPTY_FORM): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.dpi) {
    errors.dpi = "El DPI es obligatorio.";
  } else if (!/^\d{13}$/.test(form.dpi)) {
    errors.dpi = "El DPI debe tener exactamente 13 dígitos numéricos.";
  }

  if (!form.firstName.trim())
    errors.firstName = "El primer nombre es obligatorio.";
  if (!form.lastName.trim())
    errors.lastName = "El primer apellido es obligatorio.";

  if (!form.email) {
    errors.email = "El correo es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "El correo no tiene un formato válido.";
  }

  if (form.phone && !/^\d{8}$/.test(form.phone)) {
    errors.phone = "El teléfono debe tener 8 dígitos numéricos.";
  }

  if (!form.baseSalary) {
    errors.baseSalary = "El salario es obligatorio.";
  } else if (isNaN(Number(form.baseSalary)) || Number(form.baseSalary) <= 0) {
    errors.baseSalary = "El salario debe ser un número mayor a 0.";
  }

  if (!form.birthDate) {
    errors.birthDate = "La fecha de nacimiento es obligatoria.";
  } else {
    const birth = new Date(form.birthDate);
    const minAge = new Date();
    minAge.setFullYear(minAge.getFullYear() - 18);
    if (birth > minAge)
      errors.birthDate = "El empleado debe tener al menos 18 años.";
  }

  if (!form.hireDate) {
    errors.hireDate = "La fecha de contratación es obligatoria.";
  } else {
    const hire = new Date(form.hireDate);
    const today = new Date();
    today.setHours(23, 59, 59);
    const minHire = new Date();
    minHire.setFullYear(minHire.getFullYear() - 50);
    if (hire > today)
      errors.hireDate = "La fecha de contratación no puede ser futura.";
    else if (hire < minHire)
      errors.hireDate = "La fecha no puede ser de hace más de 50 años.";
  }

  if (!form.departmentId) errors.departmentId = "Selecciona un departamento.";
  if (!form.positionId) errors.positionId = "Selecciona un puesto.";

  return errors;
}

function SortIcon({
  field,
  sortBy,
  sortOrder,
}: {
  field: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}) {
  if (sortBy !== field) return <span className="text-slate-300 ml-1">↕</span>;
  return (
    <span className="text-primary-500 ml-1">
      {sortOrder === "asc" ? "↑" : "↓"}
    </span>
  );
}

function EmployeesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [departmentId, setDept] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [statusModal, setStatusModal] = useState<{
    id: string;
    name: string;
    current: string;
  } | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");

  const queryEnabled = isAuthenticated && !!user?.accessToken;

  const filters: EmployeeFilters = {
    search: search || undefined,
    departmentId: departmentId || undefined,
    status: status || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: sortBy || undefined,
    sortOrder: sortBy ? sortOrder : undefined,
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["employees", filters],
    queryFn: () => employeeService.list(filters),
    enabled: queryEnabled,
  });

  const { data: catalogs } = useQuery({
    queryKey: ["employee-catalogs"],
    queryFn: () => employeeService.getCatalogs(),
    enabled: queryEnabled,
    staleTime: 5 * 60 * 1000,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => employeeService.listUsers(),
    enabled: queryEnabled && showCreate,
  });

  const items = data?.items ?? [];
  const meta = data?.meta;
  const total = meta?.totalItems ?? 0;
  const pages = meta?.totalPages ?? 1;

  function resetPage() {
    setPage(1);
  }
  function toggleSort(field: string) {
    if (sortBy === field) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setSortOrder("asc");
    }
    resetPage();
  }

  const filteredPositions =
    catalogs?.positions.filter(
      (p) => !form.departmentId || p.departmentIds.includes(form.departmentId),
    ) ?? [];

  const closeCreate = () => {
    setShowCreate(false);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFieldErrors({});
  };

  const createMutation = useMutation({
    mutationFn: () =>
      employeeService.create({
        dpi: form.dpi,
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        secondLastName: form.secondLastName || undefined,
        birthDate: form.birthDate,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email,
        baseSalary: form.baseSalary,
        hireDate: form.hireDate,
        departmentId: form.departmentId,
        positionId: form.positionId,
        userId: form.userId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      closeCreate();
    },
    onError: (err: {
      response?: { data?: { message?: string | string[] } };
    }) => {
      const msg = err.response?.data?.message;
      const text = Array.isArray(msg)
        ? msg.join(". ")
        : (msg ?? "Error al crear el empleado. Intenta nuevamente.");
      setFormError(text);
    },
  });

  const statusMutation = useMutation({
    mutationFn: () =>
      employeeService.changeStatus(
        statusModal!.id,
        newStatus,
        statusReason || undefined,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setStatusModal(null);
      setNewStatus("");
      setStatusReason("");
    },
  });

  const handleCreate = () => {
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Corrige los errores antes de continuar.");
      return;
    }
    setFieldErrors({});
    setFormError(null);
    createMutation.mutate();
  };

  const inputField = (
    id: keyof typeof form,
    label: string,
    type = "text",
    required = false,
  ) => (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={form[id]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [id]: e.target.value }));
          if (fieldErrors[id]) setFieldErrors((fe) => ({ ...fe, [id]: "" }));
        }}
        className={`input-field ${fieldErrors[id] ? "border-red-400 focus:ring-red-400" : ""}`}
        aria-required={required}
        aria-describedby={fieldErrors[id] ? `${id}-error` : undefined}
      />
      {fieldErrors[id] && (
        <p id={`${id}-error`} className="error-message mt-1" role="alert">
          {fieldErrors[id]}
        </p>
      )}
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Empleados</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {isLoading ? "Cargando..." : `${total} empleados encontrados`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary text-sm py-1.5 px-4"
        >
          + Nuevo empleado
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label htmlFor="search" className="label">
            Buscar
          </label>
          <input
            id="search"
            type="search"
            placeholder="Nombre, email o codigo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            className="input-field"
          />
        </div>
        <div className="min-w-44">
          <label htmlFor="dept" className="label">
            Departamento
          </label>
          <select
            id="dept"
            value={departmentId}
            onChange={(e) => {
              setDept(e.target.value);
              resetPage();
            }}
            className="input-field"
          >
            <option value="">Todos</option>
            {catalogs?.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-36">
          <label htmlFor="status" className="label">
            Estado
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            className="input-field"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        {(search || departmentId || status) && (
          <button
            onClick={() => {
              setSearch("");
              setDept("");
              setStatus("");
              resetPage();
            }}
            className="btn-danger py-2"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Error */}
      {isError && (
        <div className="card p-5 border-l-4 border-red-400 mb-5" role="alert">
          <p className="text-sm font-medium text-red-700 mb-2">
            No se pudieron cargar los empleados
          </p>
          <button
            onClick={() => refetch()}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div
          className="flex items-center justify-center py-20"
          aria-busy="true"
        >
          <svg
            className="animate-spin w-5 h-5 mr-2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-sm text-slate-400">Cargando empleados...</span>
        </div>
      )}

      {/* Vacío */}
      {!isLoading && !isError && items.length === 0 && (
        <div className="card p-12 text-center" role="status">
          <p className="text-slate-400 text-sm">
            No se encontraron empleados con los filtros aplicados.
          </p>
        </div>
      )}

      {/* Tabla */}
      {!isLoading && !isError && items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-slate-600"
                  >
                    <button
                      onClick={() => toggleSort("firstName")}
                      className="flex items-center hover:text-slate-900 focus:outline-none"
                      aria-sort={
                        sortBy === "firstName"
                          ? sortOrder === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      Empleado{" "}
                      <SortIcon
                        field="firstName"
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                      />
                    </button>
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell"
                  >
                    Departamento
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell"
                  >
                    Puesto
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-slate-600"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-slate-600"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {emp.employeeCode} · {emp.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {emp.department.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">
                      {emp.position.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${STATUS_COLORS[emp.status] ?? "badge-gray"}`}
                      >
                        {STATUS_LABELS[emp.status] ?? emp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/empleados/${emp.id}/documentos`}
                          className="btn-primary text-xs py-1 px-2.5"
                          aria-label={`Ver expediente de ${emp.firstName} ${emp.lastName}`}
                        >
                          Expediente
                        </a>
                        <button
                          onClick={() => {
                            setStatusModal({
                              id: emp.id,
                              name: `${emp.firstName} ${emp.lastName}`,
                              current: emp.status,
                            });
                            setNewStatus(emp.status);
                            setStatusReason("");
                          }}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          Estado
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-2">
              <p className="text-xs text-slate-500">
                Pagina {page} de {pages} · {total} empleados
              </p>
              <div
                className="flex gap-1"
                role="navigation"
                aria-label="Paginacion"
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`text-xs py-1.5 px-3 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 ${p === page ? "bg-primary-600 text-white border-primary-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                      aria-current={p === page ? "page" : undefined}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal crear empleado */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-start justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Nuevo empleado"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Nuevo empleado</h3>
              <button
                onClick={closeCreate}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div
                  className="card p-3 border-l-4 border-red-400"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Los campos con <span className="text-red-500">*</span> son
                obligatorios.
              </p>

              <fieldset>
                <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Datos personales
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inputField("dpi", "DPI", "text", true)}
                  {inputField("birthDate", "Fecha de nacimiento", "date", true)}
                  {inputField("firstName", "Primer nombre", "text", true)}
                  {inputField("middleName", "Segundo nombre")}
                  {inputField("lastName", "Primer apellido", "text", true)}
                  {inputField("secondLastName", "Segundo apellido")}
                  {inputField("phone", "Teléfono (8 dígitos)")}
                  {inputField("address", "Dirección")}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Datos laborales
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inputField("email", "Correo electrónico", "email", true)}
                  {inputField("baseSalary", "Salario base (Q)", "text", true)}
                  {inputField(
                    "hireDate",
                    "Fecha de contratación",
                    "date",
                    true,
                  )}

                  <div>
                    <label htmlFor="dept-create" className="label">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="dept-create"
                      value={form.departmentId}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          departmentId: e.target.value,
                          positionId: "",
                        }));
                        if (fieldErrors.departmentId)
                          setFieldErrors((fe) => ({ ...fe, departmentId: "" }));
                      }}
                      className={`input-field ${fieldErrors.departmentId ? "border-red-400" : ""}`}
                      aria-required="true"
                    >
                      <option value="">Selecciona...</option>
                      {catalogs?.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.departmentId && (
                      <p className="error-message mt-1" role="alert">
                        {fieldErrors.departmentId}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pos-create" className="label">
                      Puesto <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="pos-create"
                      value={form.positionId}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, positionId: e.target.value }));
                        if (fieldErrors.positionId)
                          setFieldErrors((fe) => ({ ...fe, positionId: "" }));
                      }}
                      className={`input-field ${fieldErrors.positionId ? "border-red-400" : ""}`}
                      aria-required="true"
                      disabled={!form.departmentId}
                    >
                      <option value="">Selecciona...</option>
                      {filteredPositions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.positionId && (
                      <p className="error-message mt-1" role="alert">
                        {fieldErrors.positionId}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="user-create" className="label">
                      Usuario del sistema{" "}
                      <span className="text-xs text-slate-400 font-normal">
                        (opcional)
                      </span>
                    </label>
                    <select
                      id="user-create"
                      value={form.userId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, userId: e.target.value }))
                      }
                      className="input-field"
                    >
                      <option value="">Sin usuario vinculado</option>
                      {users.map(
                        (u: {
                          id: string;
                          firstName: string;
                          lastName: string;
                          email: string;
                        }) => (
                          <option key={u.id} value={u.id}>
                            {u.firstName} {u.lastName} — {u.email}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={closeCreate}
                disabled={createMutation.isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="btn-primary min-w-24"
              >
                {createMutation.isPending ? "Guardando..." : "Crear empleado"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar estado */}
      {statusModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Cambiar estado"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Cambiar estado</h3>
              <button
                onClick={() => setStatusModal(null)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                aria-label="Cerrar"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Empleado:{" "}
                <span className="font-medium text-slate-900">
                  {statusModal.name}
                </span>
              </p>
              <div>
                <label htmlFor="new-status" className="label">
                  Nuevo estado <span className="text-red-500">*</span>
                </label>
                <select
                  id="new-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input-field"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option
                      key={s}
                      value={s}
                      disabled={s === statusModal.current}
                    >
                      {STATUS_LABELS[s]}
                      {s === statusModal.current ? " (actual)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status-reason" className="label">
                  Motivo{" "}
                  <span className="text-xs text-slate-400 font-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  id="status-reason"
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ej: Renuncia voluntaria, término de contrato..."
                  className="input-field"
                />
              </div>
              {statusMutation.isError && (
                <p className="text-sm text-red-600" role="alert">
                  Error al cambiar el estado. Intenta nuevamente.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setStatusModal(null)}
                disabled={statusMutation.isPending}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => statusMutation.mutate()}
                disabled={
                  statusMutation.isPending || newStatus === statusModal.current
                }
                className="btn-primary min-w-24"
              >
                {statusMutation.isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeesPage;
