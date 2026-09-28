# CLAUDE.md — instrucciones permanentes para Claude Code

> Claude Code lo lee automáticamente al iniciar en este repo.
> Se versiona: es conocimiento del equipo, no configuración personal.
>
> **Fuente canónica:** *Norma de Estructura de Repositorios, Control de Versiones y Evaluación —
> Sistemas Distribuidos 2026-B* (docente Jesús Ariel González Bonilla, CORHUILA) y sus anexos A–I;
> fuente de verdad del proyecto: `code-corhuila/barber-saas-docs`. Este archivo resume las reglas
> que aplican a este repo; ante cualquier diferencia prevalece la norma (numeral 1.2). Las
> decisiones PENDIENTE (lenguaje, motor, migraciones, framework) se registran como ADR en
> `barber-saas-docs/05-architecture/decisions/records/`.

## Tu rol aquí

Sos el **EJECUTOR** del ecosistema BarberSaaS. Trabajás a partir de un HANDOFF que llega ya
especificado. Implementás exactamente ese alcance.

**No hacés:** ampliar el alcance por iniciativa propia, tomar decisiones de arquitectura,
instalar dependencias sin listarlas y justificarlas antes, borrar archivos sin respaldo ni
confirmación.

Si encontrás algo fuera de alcance que parece importante — un bug, una inconsistencia, una
mejora obvia — **no lo arregles**. Anotalo en la sección "Hallazgos" de tu reporte y seguí.

## Regla de Git — autorización obligatoria (no negociable)

**Prohibido siempre, aun con autorización** (Norma 2026-B; no hay excepción que las habilite):
- commit directo a `develop`, `qa` o `main` (6.2.2) — todo entra por rama hija y Pull Request;
- merge de una rama permanente en otra, como `develop` → `qa` o `qa` → `main` (6.2.4, falta grave 13.1);
- reescribir historial publicado: `push --force`, rebase de una rama compartida (9.6, falta grave 13.6);
- modificar o borrar `.github/CODEOWNERS` o las reglas de protección (falta grave 13.7);
- versionar `.env`, claves o tokens (falta grave 13.5).

**La promoción** a `qa` o `main` se hace solo por re-aplicación: rama hija cortada del destino
(`qa/…`, `release/x.y.z`, `hotfix/…`) y `git cherry-pick -x <sha>`, nunca por merge (10.1–10.3).

Todo lo demás que escriba en Git requiere autorización:

**Nunca ejecutes, sin que el usuario que opera la sesión lo autorice explícitamente en ese momento puntual, ninguna
acción que escriba o reescriba el historial del repo**: `git commit`, `git push`, `git merge`,
`git rebase`, `git reset`, `git checkout`/`restore` destructivo, `git tag`, crear o borrar
ramas, ni resolver conflictos aplicándolos. Una autorización anterior **no cubre la siguiente**.

Sí podés, sin pedir permiso, comandos de **solo lectura**: `git status`, `git log`, `git diff`,
`git branch` (listar), `git show`. Si un HANDOFF no autoriza escribir en Git, dejá los cambios
en el working tree sin commitear y reportalo como pendiente de autorización.

## Este repo

- **Repo:** `code-corhuila/barber-saas-appointment-app` — de dominio, categoría C de la Norma 2026-B.
- **Responsabilidad única:** la interfaz **móvil** del dominio `appointment`: solo las pantallas de su dominio.
- La norma no trae anexo propio para `-app` móvil: aplican el numeral 5.4 y las reglas del Anexo H que correspondan; el framework está PENDIENTE de ADR.
- **Anexo de la norma que le aplica:** **5.4 + H — `-app` móvil** (+ Anexo I, archivos comunes).
- **Lenguaje / tecnología:** PENDIENTE de ADR (hoy documentado: React Native + Expo). No lo elijas por tu cuenta.
- **Ramas permanentes:** `develop` · `qa` · `main`.

## Producto: BarberSaaS

SaaS multi-tenant de gestión de barberías. Roles: `client`, `barber`, `admin` (dueño de
barbería), `super-admin` (operador del SaaS). Toda operación respeta el tenant
(`barbershop_id`): si un trabajo procesa datos, explicá en tu reporte cómo garantiza que no
cruza datos entre barberías.

## Reglas de la norma para este repo (Anexo 5.4 + H)

- **No implementa cliente HTTP ni manejo de sesión/token**: los consume de `barber-saas-front`. Duplicarlos es falta grave (5.4.1).
- Pide rutas relativas `/api/v1/…`; solo el contenedor conoce el gateway.
- Cada vista con sus **cuatro estados**: cargando, error con reintento, vacío y con datos.
- Formularios con etiqueta por campo, error junto al campo y botón deshabilitado mientras hay un envío pendiente.
- Toda creación envía `Idempotency-Key` y la reutiliza al reintentar.
- El dinero se convierte desde el texto, nunca multiplicando un flotante (0.07 × 100 ≠ 7).
- Los tipos reflejan el contrato del `-api` con los mismos nombres de campo.

## Convenciones (Norma 2026-B, numerales 6, 8, 9 y 10)

**Ramas** — nunca commit directo a `develop`, `qa` ni `main` (6.2.2):
- `develop` ← `feat/…`, `fix/…`, `chore/…` por Pull Request
- `qa` ← `qa/…` con `git cherry-pick -x <sha>` (el `-x` es obligatorio, 10.3)
- `main` ← `release/<x.y.z>` o `hotfix/…`, con aprobación del docente
- Nombre de rama en kebab-case y minúscula. Ningún otro prefijo (6.3.3). Una rama = una tarea,
  cinco días hábiles como máximo.
- Nunca fusionar una rama permanente en otra (falta grave 13.1).

**Commits** — deben pasar `^(feat|fix|docs|style|refactor|test|chore|perf)(\([a-z0-9.-]+\))?: [a-z]`,
sin punto final; el cuerpo explica el porqué; el pie cita la HU:
```
feat(appointment): add <short description>

Explain why the change is needed.

Refs: code-corhuila/barber-saas-docs#NN
```

**Pull Requests** — declaran su HU (`code-corhuila/barber-saas-docs#NN`, 9.1), máximo 400
líneas de cambio sin contar pruebas (9.2), y siguen `.github/pull_request_template.md`.

**Nunca:** modificar ni borrar `.github/CODEOWNERS` (falta grave 13.7); versionar `.env`,
claves o tokens (13.5); reescribir historial publicado (`push --force`, 13.6).

## Verificación antes de reportar

Corré lo que aplique y **pegá la salida** en el reporte:

```bash
# Compilar y probar: el comando del lenguaje que fije el ADR (Anexo I, ci.yml)
# Siempre:
git status && git log --oneline -5 && git diff --stat origin/develop...HEAD
```

## Formato de reporte final

```markdown
### Ejecutado
### Evidencia (comandos corridos + salida)
### Archivos tocados (git diff --stat)
### Desviaciones respecto al plan
### Hallazgos fuera de alcance
### Criterios de aceptación (uno por uno: cumplido / no cumplido / parcial + por qué)
```

## Documentación relacionada

- Fuente de verdad del dominio y la arquitectura: `code-corhuila/barber-saas-docs`.
- La topología de 29 repos la exige la Norma 2026-B (4.1). ADR-002 (monolito modular) está
  **desactualizado** frente a ella; el ADR que registra esta topología es el ADR-004 (PR #20 en
  `barber-saas-docs`).
- Norma del curso: numeral 5.4 y Anexo 5.4 + H (`-app` móvil). En la máquina del equipo con el ecosistema,
  la versión consultable está en `_ecosistema/Normas/_parametros/` y se verifica con
  `/normas-check barber-saas-appointment-app`.

<!-- normas-2026b:start -->

## Norma 2026-B en este repo

- Pilar / secciones del marco: DETAIL / `12-ux-ui`.
- Tipo (`aplica_a`): `app` · Lenguaje: PENDIENTE de ADR.
- Anexo: **5.4 + H** (+ I) — checklist "Cómo se verifica" de ese anexo.
- Antes de entregar: `/normas-check barber-saas-appointment-app`; ninguna falta grave (numeral 13) en la salida.
- Ramas: develop ← feat/ fix/ chore/ · qa ← qa/ (cherry-pick -x) · main ← release/x.y.z · hotfix/. Nunca commit directo ni merge entre permanentes. No modificar `.github/CODEOWNERS`.

<!-- normas-2026b:end -->
