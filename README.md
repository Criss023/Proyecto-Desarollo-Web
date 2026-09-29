# Mini Sistema de RRHH

Proyecto práctico del curso **Desarrollo Web (036)** — UMG, Ingeniería en Sistemas,
Centro Universitario de Chiquimulilla. Se construye de forma incremental, clase a
clase, a lo largo del Módulo I: Fundamentos de React + TypeScript.

## Stack

- [Vite](https://vitejs.dev) — build tool y servidor de desarrollo con HMR.
- [React 18](https://react.dev) — librería de UI.
- [TypeScript](https://www.typescriptlang.org) — tipado estático.
- [ESLint](https://eslint.org) (`typescript-eslint` + `eslint-plugin-react-hooks` +
  `eslint-plugin-react-refresh`) — el linter del proyecto.

## Cómo correrlo

```bash
npm install       # instala las dependencias listadas en package.json
npm run dev        # levanta el servidor de desarrollo en http://localhost:5173
npm run build       # compila TypeScript (tsc -b) y genera el build de producción con Vite
npm run lint       # corre ESLint sobre todo el proyecto
npm run preview      # sirve el build de producción localmente, para verificarlo
```

## Estructura del proyecto

```
src/
├── components/    # Componentes reutilizables (EmployeeCard, etc.)
├── pages/       # Páginas completas (Login, Dashboard, Empleados) — desde clases futuras
├── layouts/     # Estructuras de página (Header, Sidebar)
├── hooks/       # Custom hooks — desde clases futuras
├── store/       # Zustand stores (estado global) — desde clases futuras
├── services/     # Llamadas a la API — desde clases futuras
├── types/      # Interfaces y types de TypeScript compartidos
└── utils/      # Funciones utilitarias y datos de ejemplo (mockData)
```