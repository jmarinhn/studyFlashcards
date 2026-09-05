# ⚡ studyFlashcards

Aplicación interactiva de Flashcards para estudio y exámenes, con experiencia de tarjetas deslizables (**Flashcards**), soporte para volteo 3D con tap, bucle iterativo para repasar preguntas fallidas hasta dominarlas todas, y modo examen con temporizador y Leaderboard.

Totalmente modernizada con **Vite 6 + React 18**, con **0 vulnerabilidades (0 CVEs)** y lista para desplegarse con **Docker**.

---

## ✨ Características Principales

- **🔥 Modo Estudio Interactivo (Flashcards)**:
  - **Arrastre interactivo (Mouse & Touch)**: Desplaza la carta con rotación física y sellos dinámicos:
    - **Swipe Derecha / Verde**: ¡Respuesta correcta!
    - **Swipe Izquierda / Rojo**: Respuesta incorrecta / Para repasar.
  - **Volteo 3D con Tap (Flip to Reveal)**: Toca cualquier parte de la carta (o el botón central 🔄) para girarla en 3D y revelar la respuesta correcta con su explicación.
  - **Controles flotantes & Atajos de teclado**:
    - `←` o `A`: Repasar (Swipe Izquierda)
    - `Espacio` o `Enter` o `↑` / `↓`: Voltear Carta
    - `→` o `D`: Correcto (Swipe Derecha)
- **🔄 Bucle de Repaso de Errores (Study Review Loop)**:
  - Al terminar el mazo, muestra el puntaje exacto de correctas, malas y porcentaje de acierto.
  - Botón **"Repasar solo las malas ({N})"**: Inicia una ronda exclusiva con las preguntas falladas.
  - Se repite en bucle hasta que todas las cartas hayan sido respondidas correctamente (**100% de Dominio con celebración de Confetti**).
- **📝 Modo Examen (Test Mode)**:
  - Evaluación formal contrarreloj (60 minutos) con preguntas barajadas.
  - Selección interactiva de opciones (admite preguntas de respuesta simple y de selección múltiple).
  - Puntaje porcentual final, estatus de Aprobado/Reprobado (mínimo 70%) y desglose detallado pregunta por pregunta.
- **🏆 Leaderboard**:
  - Registro de los mejores puntajes con nombres y fechas persistido localmente.
- **📦 Mazos Precargados & Carga Personalizada**:
  - Incluye mazos listos para jugar: *AWS Cloud & DevOps Essentials* y *JavaScript & Web Moderno*.
  - Soporte para importar cualquier archivo `.json` mediante arrastrar y soltar (Drag & Drop).

---

## 📄 Formato del archivo JSON

Puedes cargar archivos `.json` con preguntas siguiendo esta estructura:

```json
{
  "1": {
    "question": "¿Cuál es la capital de Francia?",
    "options": {
      "A": "Madrid",
      "B": "París",
      "C": "Londres",
      "D": "Roma"
    },
    "answer_official": "B",
    "answer_community": "B",
    "explanation": "París es la capital y ciudad más poblada de Francia."
  },
  "2": {
    "question": "¿Cuáles son protocolos de capa de transporte en TCP/IP? (Selección múltiple)",
    "options": {
      "A": "TCP",
      "B": "HTTP",
      "C": "UDP",
      "D": "IP"
    },
    "answer_official": "AC",
    "answer_community": "AC",
    "explanation": "TCP y UDP operan en la capa de transporte del modelo TCP/IP."
  }
}
```

---

## 🚀 Ejecución Local

### 1. Desarrollo con Hot-Reload
```bash
npm install
npm run dev
```
Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

### 2. Compilar para Producción
```bash
npm run build
npm run preview
```

### 3. Auditoría de Seguridad (Zero CVEs)
```bash
npm audit
# 0 vulnerabilities
```

---

## 🐳 Despliegue con Docker

### Producción (Nginx Alpine optimizado ~25MB)
```bash
# Construir y levantar el contenedor
docker compose up -d --build

# Abrir en el navegador
http://localhost:8080
```

### Desarrollo en Docker con Hot-Reload
```bash
docker compose run --service-ports dev
# Abrir en http://localhost:3000
```
## Acceso con Google

1. En [Google Auth Platform](https://console.cloud.google.com/auth/clients), configura Branding y Audience si el proyecto lo solicita y crea un cliente OAuth de tipo **Aplicación web**.
2. Añade los orígenes exactos a **Orígenes autorizados de JavaScript**: `http://localhost:5173` para desarrollo, `http://localhost:8080` para Docker y `https://study-flashcards.vercel.app` para producción. No incluyas rutas. Este flujo usa el botón GIS con popup y callback JavaScript, sin ruta de redirección.
3. Copia `.env.example` a `.env.local` y configura `VITE_GOOGLE_CLIENT_ID` con el ID público terminado en `.apps.googleusercontent.com`. Nunca pongas el Client Secret en variables `VITE_*`.
4. Reinicia Vite. En Vercel configura esa variable en el entorno correspondiente y vuelve a desplegar: Vite la incorpora durante la compilación. Para Docker puedes proporcionar `VITE_GOOGLE_CLIENT_ID` mediante `.env` o el entorno de Docker Compose y reconstruir.

Sin un Client ID válido, el modal explica que Google no está configurado y permite continuar estudiando. Si falla la carga de Google, ofrece reintentar. Si Google informa que el origen no está permitido, comprueba el esquema, dominio y puerto del cliente OAuth.

El perfil, progreso y leaderboard se almacenan localmente en el navegador; no hay sincronización entre dispositivos ni sesión de servidor. Los claims del ID token se leen para mostrar el perfil, sin guardar el token. Antes de usar esta identidad para proteger una API o datos remotos, el servidor deberá verificar criptográficamente el ID token y crear una sesión segura.

## Community Decks y editor de guías

Las cuentas verificadas pueden crear guías con el editor manual o importar JSON, guardarlas como borradores y enviarlas a revisión. El administrador aprueba la publicación y ve usuarios, mazos y actividad. Las respuestas comunitarias se calculan mediante votos únicos por cuenta. Consulta [la configuración del servicio](supabase/README.md). Requiere Node 22 o posterior.
