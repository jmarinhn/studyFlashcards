# Community Decks

## Activación

1. Usar un proyecto Supabase exclusivo de StudyFlashcards. Aplicar la migración de `migrations/` mediante la herramienta `apply_migration` o el flujo de migraciones de Supabase CLI.
2. En Supabase Authentication → Sign In / Providers → Google, habilitar Google y añadir el Client ID `321235845268-jmkqhkbvql5d0jf3j2v0qd1po59lb08u.apps.googleusercontent.com`. Completar la configuración que solicite el proveedor directamente en el dashboard. No guardar el Client Secret en el repositorio ni en variables `VITE_*`.
3. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env.local` y en Vercel. Usar únicamente una clave pública habilitada (`sb_publishable_...`), nunca una clave secret o service_role. Reconstruir y desplegar con Node 22 o posterior.
4. Conservar los orígenes JavaScript de Google para localhost y `https://study-flashcards.vercel.app`. Mantener activa la validación de nonce; el navegador envía un nonce SHA-256 a Google y su valor original a Supabase. Se intercambia el ID token del botón GIS por una sesión Supabase mediante `signInWithIdToken`.
5. Volver a iniciar sesión con Google. Los perfiles locales anteriores no autorizan acciones en comunidad.
6. Iniciar sesión con `jdmarinv@gmail.com` para activar el administrador. La base de datos verifica el email confirmado y la identidad Google verificada en `auth.users`/`auth.identities`; no confía en roles ni correos enviados desde el navegador.
7. Ejecutar los advisors de Supabase después de aplicar el esquema y comprobar el flujo con dos cuentas reales. Las tablas tienen RLS y ningún permiso directo para los clientes; la API explícita es `study_community`, una función invoker que llama a una función privada con controles por acción.

## Comportamiento

- Editor manual, 2–6 opciones, respuestas múltiples, explicación, importación JSON; hasta 200 preguntas/2 MB por guía y 50 guías nuevas por usuario al día.
- Borradores privados, envío a revisión, aprobación o devolución con motivo. Solo las guías publicadas aparecen en Community Decks. Para modificar una guía publicada o pendiente se crea una nueva versión; así no se altera el sentido de los votos existentes.
- Enlaces `?deck=<uuid>` abren una guía tras el login. Un borrador no es visible para otra cuenta aunque conozca su enlace.
- Voto de utilidad del mazo y voto por combinación de respuestas. Una fila por cuenta y pregunta; cambiar el voto reemplaza el anterior y se puede retirar. El autor no puede fijar `answer_community`.
- La comunidad necesita mayoría absoluta (>50 % de votos). En empate o sin mayoría se muestra «Sin consenso» y se utiliza la respuesta original al estudiar. El autor y la respuesta comunitaria permanecen visibles por separado.
- Los votos se cuentan al consultar la guía; el código cliente no puede modificar contadores. Al devolver una guía y editarla se descartan los votos anteriores para no aplicarlos a preguntas modificadas.
- Administración: número de cuentas registradas, actividad de los últimos 7 días, guías creadas/pendientes/publicadas, votos y lista paginada de usuarios. Los eventos de estudio/examen/descarga son de cuentas conectadas y se deduplican por tipo, usuario y minuto. No son analítica histórica ni incluyen visitantes anónimos.
- El historial de errores y el leaderboard previo siguen guardados localmente. Las guías y los votos nuevos se guardan en la cuenta.

## Verificación

`npm test` incluye un PostgreSQL aislado mediante PGlite con roles Auth simulados para comprobar privilegios, borradores, moderación, votos repetidos, empates y cambios de respuesta. No sustituye la verificación del proveedor Google y RLS/API en el proyecto hospedado. `npm run build` genera la aplicación. Sin las variables Supabase la comunidad muestra «en preparación» y no simula cuentas ni votos remotos.
