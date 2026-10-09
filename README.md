# Runner Quiz

Juego web tipo endless runner con preguntas y recompensas para una meta de 400 metros.

## Cómo ejecutar

1. Descarga o clona este proyecto.
2. Abre `index.html` en el navegador, o sirve la carpeta localmente con:
   ```bash
   python -m http.server 8000
   ```
3. Visita `http://localhost:8000`.

## Personalización

- Para cambiar el personaje principal, usa el botón "Cargar personaje local" o reemplaza `assets/runner.svg` por tu imagen.
- Las recompensas de cada punto de control se cargan desde `assets/reward-100.svg`, `assets/reward-200.svg`, `assets/reward-300.svg` y `assets/reward-400.svg`.
- Las preguntas se pueden editar en `game.js` dentro del array `checkpointQuestions`.

## Requisitos

- HTML5
- CSS3
- JavaScript
- Compatible con GitHub Pages

## Nota

Las pruebas se ejecutan en un navegador moderno y la solución está preparada para publicarse sin servidores adicionales.
