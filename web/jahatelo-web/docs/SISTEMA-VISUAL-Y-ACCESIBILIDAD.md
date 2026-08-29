# Sistema visual y accesibilidad

Web, PWA, iOS y Android usan una única dirección visual: violeta Jahatelo, superficies blancas, fondo lavanda suave, texto ciruela oscuro, radios de 12 a 20 px y sombras discretas.

## Reglas

- Acción táctil mínima: 44×44 px.
- Toda acción de icono debe tener nombre accesible.
- El foco de teclado debe permanecer visible.
- Los errores deben mostrarse junto al campo o formulario y anunciarse con `role="alert"` en web.
- No comunicar estados solamente con color: combinar texto, icono o etiqueta.
- Respetar reducción de movimiento en web; las apps evitarán animaciones esenciales para comprender una acción.
- Jahatelo usa modo claro hasta completar y validar una implementación oscura integral.

## Tokens

- Primario: `#822DE2` web / `#8E2DE2` app.
- Texto principal: `#2E0338`.
- Texto secundario: `#6A5E6E`.
- Fondo suave: `#F8F5FC`.
- Borde: `#E8DFF0`.
- Éxito: `#10B981`; advertencia: `#F59E0B`; error: `#EF4444`.
