# ExpedienteRH - Grupo g03

Sistema de Recursos Humanos - Modulo de Expediente Digital  
Curso 036 Desarrollo Web | Universidad Mariano Galvez de Guatemala | 2026

---

## Integrantes

- Cristian Ronaldo Sagastume Ceballos
- Francisco Ricardo Veliz Hernandez
- Vielman Anibal Vasquez Ramos

---

## Stack tecnologico

- React 18 + Vite + TypeScript
- React Router (enrutamiento)
- TanStack Query (estado del servidor)
- Zustand + persist (autenticacion)
- react-hook-form + Zod (formularios)
- TailwindCSS (estilos)
- Axios (cliente HTTP)

---

## Instalacion

```bash
# 1. Clonar el repositorio
git clone https://github.com/Criss023/Proyecto-Desarollo-Web.git
cd Proyecto-Desarollo-Web

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env y agregar la URL de la API asignada
```

---

## Variables de entorno

| Variable | Descripcion | Ejemplo |
|---|---|---|
| `VITE_API_URL` | URL base de la instancia api-g03 sin /api/v1 | `https://api-g03-xxx.run.app` |

---

## Comandos

```bash
# Desarrollo
npm run dev

# Build de produccion
npm run build

# Preview del build
npm run preview
```

---

## Guia por rol

### ADMIN
1. Iniciar sesion con credenciales de administrador
2. Ver el dashboard con metricas de RRHH
3. Gestionar empleados en /empleados
4. Ver expediente de un empleado en /empleados/:id/documentos
5. Gestionar tipos de documento en /tipos-documento
6. Ver alertas documentales en /alertas
7. Ver reporte de cumplimiento en /cumplimiento

### HR_MANAGER
1. Iniciar sesion con credenciales de RRHH
2. Ver el dashboard con metricas
3. Ver y gestionar expedientes de empleados
4. Ver tipos de documento, alertas y cumplimiento (solo lectura)

### EMPLOYEE
1. Iniciar sesion con credenciales de empleado
2. Ver su perfil laboral en /mi-perfil
3. Editar sus datos de contacto (telefono y direccion)
4. Ver sus documentos en /mis-documentos

> Nota: Las cuentas EMPLOYEE deben estar vinculadas a un empleado por el administrador antes de poder usar el autoservicio.

---

## Enlace publicado

> https://proyecto-desarollo-web.vercel.app

---

## Instancia API asignada

Grupo g03 - Expediente Digital  
Swagger: https://api-g03-39462701205.us-central1.run.app/api/docs