# Reglas de Seguridad y Privacidad de Datos Sensibles

Estas reglas son obligatorias y de máxima prioridad para cualquier agente o modelo que opere en este proyecto.

---

## 1. Prohibición Absoluta de Acceso a Archivos de Entorno (.env)
- **Archivos protegidos**: Queda estrictamente **PROHIBIDO** leer, abrir, inspeccionar, imprimir o mostrar el contenido de cualquier archivo de entorno:
  - `.env`
  - `.env.*` (`.env.local`, `.env.production`, `.env.development`, `.env.test`, etc.)
  - Archivos de certificados o claves privadas (`*.pem`, `*.key`, `*.cert`, `id_rsa`, etc.)
  - Archivos de credenciales o secretos locales.
- **Herramientas de lectura bloqueadas para estos archivos**:
  - No usar `read_file` sobre archivos `.env*`.
  - No usar comandos de terminal como `cat`, `type`, `Get-Content`, `head`, `tail`, `grep` ni scripts para extraer valores de `.env*`.
- **Manejo de variables necesarias**:
  - Si el proyecto requiere nuevas variables de entorno, el agente debe referirse **únicamente al nombre de la clave** (por ejemplo: `SUPABASE_KEY` o `DATABASE_URL`) y usar valores ficticios o marcadores de posición (`TU_CLAVE_AQUI`) en archivos públicos como `.env.example`.
  - Jamás pedir al usuario que pegue sus contraseñas o claves privadas en el chat.

---

## 2. Protección Contra Fugas a Internet y Código Público
- **Cero publicación de credenciales**: Está totalmente prohibido incluir, incrustar, reflejar o transferir cualquier clave secreta, API key, token de autenticación o dato sensible en:
  - Commits o historial de Git.
  - Llamadas a APIs externas, herramientas de búsqueda web o plugins de terceros.
  - Respuestas públicas o mensajes que puedan registrarse o filtrarse externamente.
- **Control de Versiones (Git)**:
  - Mantener siempre `.env*` dentro del `.gitignore`.
  - Si por accidente se detecta un archivo de entorno en el staging de Git (`git status`), debe excluirse inmediatamente sin exponer su contenido.
- **Seguridad en Next.js / Frontend**:
  - Nunca colocar secretos de backend (claves maestras de bases de datos, claves secretas de pago) en variables accesibles al cliente (aquellas que inician con `NEXT_PUBLIC_`).

