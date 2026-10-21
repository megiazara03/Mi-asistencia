# Plan de Implementación SaaS Multi-tenant por Subdominios

## 1. Arquitectura General y Estrategia
- **Modelo:** Base de datos compartida con discriminador de inquilino (`tenant_id` / `subdominio`).
- **Resolución de Inquilino:** Detección automática por encabezado `Host` (ej. `instituto-a.midominio.com` -> slug: `instituto-a` / `tenant_id`). Para llamadas API directas o desarrollo local, soporte alternativo vía `X-Tenant-ID` o `localhost:puerto` con fallback o mapeo en `hosts`.
- **Nuevo Modelo / Tabla `Tenant`:**
  - `id`: INT PK Auto-increment.
  - `nombre`: VARCHAR(120) (Nombre de la institución u organización).
  - `slug`: VARCHAR(60) UNIQUE (Subdominio asignado, ej: `colegio-san-martin`).
  - `activo`: BOOLEAN (por defecto `true`).
  - `config`: JSON / TEXT opcional (branding, logo, colores, ajustes).
  - Fechas de auditoría (`creado_en`, `actualizado_en`).
- **Aislamiento en Modelos Principales:**
  - Agregar `tenant_id` (FK -> `tenant.id`) a las entidades dependientes del tenant:
    - `Usuario`
    - `Modulo`
    - `Actividad`
    - `Importacion`
  - Validaciones de unicidad compuestas (ej: `email` y `codigo` son únicos por `tenant_id`, permitiendo que el mismo email/código exista en distintas organizaciones).
  - Relaciones secundarias (`Inscripcion`, `SesionClase`, `Asistencia`) heredan contexto a través de `Modulo` / `Usuario`, pero se puede incluir `tenant_id` donde sea crítico para indexación y queries directas.

## 2. Componentes Backend (Express + Sequelize)
1. **Migración de Base de Datos:**
   - Crear tabla `tenant`.
   - Modificar tablas existentes para agregar columna `tenant_id`.
   - Seeder de tenant por defecto (`slug: 'default'`) y migración de datos existentes al tenant por defecto.
2. **Middleware de Tenant (`backend/src/middleware/tenant.js`):**
   - Extraer subdominio del `Host` (ej: `tenant.dominio.com` -> `tenant`) o encabezado `X-Tenant-ID`.
   - Consultar y validar que el tenant exista y esté activo en la BD (con caché ligera en memoria).
   - Inyectar `req.tenant` en la solicitud.
3. **Autenticación e Identificación:**
   - En login (`backend/src/services/authService.js`), buscar usuarios restringidos a `tenant_id == req.tenant.id`.
   - Incluir `tenant_id` dentro del JWT para validar integridad en cada request autenticada.
4. **Hooks / Scopes Globales de Sequelize:**
   - Scope por defecto o middleware para asegurar que las operaciones de consulta y guardado se restrinjan al tenant activo.

## 3. Componentes Frontend (React / Vite)
1. **Detección de Subdominio en Cliente:**
   - Función auxiliar `getTenantSlug()` que analiza `window.location.hostname`.
   - Si se accede desde subdominio, Axios envía la petición al backend con el subdominio o el reverse-proxy preserva el encabezado `Host`.
2. **Branding Dinámico & Contexto:**
   - `TenantContext` para cargar datos públicos del tenant (nombre, logotipo, etc.) si aplica.

## 4. Infraestructura & Reverse Proxy (Nginx / Docker / AWS)
1. **Nginx Wildcard:**
   - Configuración `server_name *.midominio.com;` para dirigir cualquier subdominio al frontend/backend.
   - Preservar encabezados `proxy_set_header Host $host;` y `proxy_set_header X-Forwarded-Host $host;`.
2. **Instrucciones para Desarrollo Local:**
   - Guía con `hosts` (ej: `tenant1.localhost`, `tenant2.localhost`).
