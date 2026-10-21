# Guía de Pruebas y Despliegue Multi-tenant (Subdominios)

Esta guía explica cómo probar y desplegar la arquitectura multi-inquilino (*Multi-tenant SaaS*) implementada por subdominios.

---

## 1. Funcionamiento del Sistema

1. **Resolución de Subdominio:**
   - Si el cliente ingresa a `colegio-a.midominio.com`, el middleware [tenant.js](file:///c:/Users/Usuario/Documents/m2/Mi-asistencia/backend/src/middleware/tenant.js) extrae el subdominio (`colegio-a`) y localiza el registro en la tabla `tenant`.
   - Se inyecta `req.tenant` en cada petición.
   - Si se accede directamente por IP o dominio raíz sin subdominio, el sistema utiliza el tenant por defecto (`slug: 'default'`).

2. **Aislamiento de Datos:**
   - La tabla [usuario](file:///c:/Users/Usuario/Documents/m2/Mi-asistencia/backend/src/models/usuario.js) y [modulo](file:///c:/Users/Usuario/Documents/m2/Mi-asistencia/backend/src/models/modulo.js) están aisladas por `tenant_id`.
   - Dos organizaciones distintas pueden tener estudiantes con el mismo número de registro o correo sin conflicto de claves únicas.
   - En el login se valida estrictamente que el usuario pertenezca al tenant del subdominio actual.

---

## 2. Pruebas en Entorno Local (Windows / Linux / Mac)

### A. Mapeo en archivo `hosts`
Para simular subdominios reales en tu máquina local, edita tu archivo de hosts (`C:\Windows\System32\drivers\etc\hosts` en Windows o `/etc/hosts` en Linux/Mac):

```text
127.0.0.1   instituto-a.localhost
127.0.0.1   instituto-b.localhost
```

### B. Ejecutar la Migración de Base de Datos
Desde el directorio `backend`:
```bash
npx sequelize-cli db:migrate
```
Esto creará la tabla `tenant` y las claves foráneas correspondientes.

### C. Crear un Tenant de Prueba
Puedes crear una organización nueva vía API usando `curl` o Postman:
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Instituto de Prueba A",
    "slug": "instituto-a",
    "admin_nombre": "Admin Instituto",
    "admin_email": "admin@instituto-a.com",
    "admin_password": "PasswordSeguro123!"
  }'
```

### D. Acceder desde el Navegador
Abre:
- `http://instituto-a.localhost:5173` (Frontend Vite en desarrollo) o a través de Nginx.
- El frontend enviará el subdominio `instituto-a` automáticamente y el backend responderá en el contexto de esa institución.

---

## 3. Configuración para Producción (Nginx Wildcard)

En tu servidor de frontend o balanceador de carga, configura el bloque de Nginx con soporte para comodines (`*.midominio.com`):

```nginx
server {
    listen 80;
    server_name *.midominio.com midominio.com;

    # Frontend SPA
    location / {
        root /var/www/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
*(Es clave preservar `Host` y `X-Forwarded-Host` para que el backend pueda resolver el subdominio correctamente).*
