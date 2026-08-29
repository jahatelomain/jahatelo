# Verificación de accesibilidad móvil

Esta lista se ejecuta antes de publicar una versión de iOS o Android.

## Texto ampliado

- Probar tamaño normal y el tamaño máximo del sistema.
- Recorrer Inicio, Búsqueda, Detalle, Mapa, Favoritos, Login, Registro y Perfil.
- Confirmar que los textos pueden envolver, las acciones siguen visibles y los formularios se pueden desplazar.
- No desactivar `allowFontScaling`; corregir el layout cuando aparezca un corte.
- La pasada de código retiró límites de una línea en títulos operativos, mantiene formularios dentro de `ScrollView` y evita alturas fijas en botones con texto.
- Pendiente de cierre físico: registrar dispositivo, sistema y capturas con el tamaño máximo antes de marcar JH-028 como completado.

## VoiceOver — iOS

- Activar en Ajustes > Accesibilidad > VoiceOver.
- Navegar con gestos por encabezados, tabs, cards, favoritos, formularios, galerías y modales.
- Confirmar nombre, rol, estado y hint de cada control; el foco debe seguir el orden visual.
- Verificar anuncios de carga, error, éxito y contenido vacío.

## TalkBack — Android

- Activar en Ajustes > Accesibilidad > TalkBack.
- Repetir los flujos anteriores y confirmar que ninguna acción dependa exclusivamente del color o de un gesto.
- Verificar botones de retroceso, navegación inferior, permisos de ubicación y apertura de detalles.

## Criterio de cierre

JH-028 y JH-029 se cierran únicamente después de registrar plataforma, versión del sistema, dispositivo y resultado. Las revisiones de código o simulador no sustituyen esta prueba física.
