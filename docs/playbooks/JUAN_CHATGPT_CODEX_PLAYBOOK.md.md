# Juan + ChatGPT + Codex Playbook

## Roles

### Juan
- Define visión y criterio estético
- Evalúa el resultado visual
- Detecta qué se siente mal o bien
- Decide pivots y dirección

### ChatGPT
- Traduce intuición → sistema
- Escribe giga prompts
- Baja ideas a arquitectura y fases
- Convierte feedback difuso en instrucciones concretas
- Ayuda a mantener consistencia

### Codex
- Lee el repo
- Implementa código
- Refactoriza
- Documenta
- Ejecuta instrucciones

---

## Workflow Loop

1. Juan define idea / problema
2. ChatGPT lo traduce en prompt o plan
3. Codex implementa
4. Juan prueba visualmente
5. ChatGPT transforma feedback en cambios accionables
6. Repetir

---

## Reglas clave

- No implementar sin explicar antes
- Iteraciones chicas y verificables
- Separar siempre:
  - problema perceptual (se siente mal)
  - problema técnico (por qué pasa)
- Si algo se siente mal → frenar y reencuadrar
- No acumular cambios sin validar

---

## Cuándo abrir una nueva sesión de Codex

- Nuevo experimento
- Cambio fuerte de dirección visual
- Arquitectura equivocada
- Demasiado ruido en la sesión actual

## Cuándo seguir en la misma sesión

- Ajustes chicos
- Bugs
- Tuning de parámetros

---

## Principio central

> Mejor una dirección fuerte que muchas débiles

---

## Anti-patrones

Evitar:
- “seguir probando cosas” sin criterio
- sumar efectos para tapar problemas
- sobreingeniería temprana
- prompts vagos
- múltiples modos mediocres

---

## Objetivo

No solo construir features.

Construir un sistema creativo a través de experimentos.