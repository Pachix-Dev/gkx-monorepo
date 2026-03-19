Estado Actual
El editor táctico está funcional y estable en este momento.

Estado de compilación/lint: sin errores en tactical-editor-client.tsx, geometry.ts, types.ts, constants.ts, app/(dashboard)/tactical-editor/page.tsx/tactical-editor/page.tsx) y dashboard-nav.ts.
Ruta y navegación: módulo integrado y accesible desde dashboard.
Editor base (Konva): fondos, assets, upload, texto, líneas/flechas/formas, selección, transformación y export PNG.
UX tipo Canva en side panel:
Rail con íconos reales + estado activo animado en tactical-editor-client.tsx:958.
Layers con drag-and-drop de reordenamiento, línea de inserción y autoscroll en tactical-editor-client.tsx:1253.
Handle dedicado para arrastrar capas en tactical-editor-client.tsx:1338.
Badge #posición por capa e interacción para mover a posición exacta en tactical-editor-client.tsx:1358.
Quick-actions flotantes frente/atrás sobre el canvas en tactical-editor-client.tsx:1760.
Atajos de teclado frente/atrás con Ctrl/Cmd+Shift+ArrowUp/ArrowDown en tactical-editor-client.tsx:223.
Animación de reordenamiento (FLIP) en layers implementada en tactical-editor-client.tsx:175.
Pendiente Técnico (si quieres seguir)

El archivo principal sigue grande; ya está separado en types/constants/geometry, pero aún conviene dividir paneles y renderer en subcomponentes para mantenimiento.