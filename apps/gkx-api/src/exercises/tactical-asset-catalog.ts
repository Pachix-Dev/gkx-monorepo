/**
 * Catálogo canónico de assets del editor táctico — v2
 *
 * Propósito:
 *   - Fuente de verdad para el servicio de generación con IA.
 *   - La IA nunca recibe rutas de archivo; solo assetId semánticos.
 *   - El servicio resuelve assetId → src para construir EditorElement válidos.
 *
 * Mantenimiento:
 *   - Los `src` deben coincidir con los archivos reales en
 *     apps/gkx-web-app/public/editor-assets/shapes/{groupId}/{filename}
 *     o apps/gkx-web-app/public/editor-assets/shapes/goalkeepers/{poseId}/{filename}
 *   - Sincronizar con get-editor-assets.ts cuando se agreguen archivos nuevos.
 *   - Incrementar CATALOG_VERSION al modificar assetIds o backgroundIds.
 */

export const CATALOG_VERSION = '4.0.0';

// ─── Canvas ──────────────────────────────────────────────────────────────────
// Valores en sync con FIXED_STAGE_WIDTH / FIXED_STAGE_HEIGHT del editor
export const CANVAS_WIDTH = 1300;
export const CANVAS_HEIGHT = 659;
export const CANVAS_MARGIN = 20;
export const MAX_ELEMENTS_PER_PLAY = 24;

// ─── Tipos ───────────────────────────────────────────────────────────────────
export type CatalogAsset = {
  /** ID semántico estable que la IA puede referenciar */
  assetId: string;
  /** Grupo al que pertenece, coincide con el directorio en shapes/ */
  groupId: string;
  /** Etiqueta legible para el entrenador */
  label: string;
  /** Ruta pública servida por Next.js (relativa a public/) */
  src: string;
  /** Tamaño por defecto al insertar en canvas (px) */
  defaultWidth: number;
  defaultHeight: number;
  /** Descripción para el system prompt de la IA */
  aiDescription: string;
};

export type CatalogBackground = {
  /** ID semántico estable que la IA puede referenciar */
  backgroundId: string;
  /** Nombre legible */
  name: string;
  /** Ruta pública servida por Next.js (relativa a public/) */
  src: string;
  /** Descripción para el system prompt de la IA */
  aiDescription: string;
};

// ─── Assets ──────────────────────────────────────────────────────────────────
export const LEGACY_CATALOG_ASSETS: CatalogAsset[] = [
  // ── Porteros — posiciones base ──────────────────────────────────────────────
  {
    assetId: 'gk-standing',
    groupId: 'goalkeepers',
    label: 'Portero de pie',
    src: '/editor-assets/shapes/goalkeepers/standing.png',
    defaultWidth: 70,
    defaultHeight: 105,
    aiDescription: 'Portero en posición inicial, de pie, sin acción',
  },
  {
    assetId: 'gk-ready',
    groupId: 'goalkeepers',
    label: 'Portero en posición base',
    src: '/editor-assets/shapes/goalkeepers/ready-stance.png',
    defaultWidth: 75,
    defaultHeight: 100,
    aiDescription:
      'Portero en posición base de preparación (rodillas flexionadas, peso adelante)',
  },
  {
    assetId: 'gk-arms-wide',
    groupId: 'goalkeepers',
    label: 'Portero brazos abiertos',
    src: '/editor-assets/shapes/goalkeepers/arms-wide.png',
    defaultWidth: 95,
    defaultHeight: 100,
    aiDescription:
      'Portero con brazos abiertos cubriendo el arco; útil para ejercicios de blocaje',
  },
  {
    assetId: 'gk-wide-block',
    groupId: 'goalkeepers',
    label: 'Portero bloqueo amplio',
    src: '/editor-assets/shapes/goalkeepers/wide-block.png',
    defaultWidth: 100,
    defaultHeight: 95,
    aiDescription:
      'Portero en posición de bloqueo amplio con piernas y brazos extendidos',
  },
  {
    assetId: 'gk-kneeling',
    groupId: 'goalkeepers',
    label: 'Portero arrodillado',
    src: '/editor-assets/shapes/goalkeepers/kneeling.png',
    defaultWidth: 75,
    defaultHeight: 80,
    aiDescription:
      'Portero arrodillado; típico en ejercicios de suelo o partida desde el piso',
  },
  {
    assetId: 'gk-sitting',
    groupId: 'goalkeepers',
    label: 'Portero sentado',
    src: '/editor-assets/shapes/goalkeepers/sitting.png',
    defaultWidth: 80,
    defaultHeight: 70,
    aiDescription:
      'Portero sentado en el suelo; posición de partida en ejercicios de reacción',
  },
  {
    assetId: 'gk-balance',
    groupId: 'goalkeepers',
    label: 'Portero equilibrio',
    src: '/editor-assets/shapes/goalkeepers/balance.png',
    defaultWidth: 70,
    defaultHeight: 105,
    aiDescription: 'Portero en ejercicio de equilibrio sobre un pie',
  },
  {
    assetId: 'gk-point-up',
    groupId: 'goalkeepers',
    label: 'Portero señalando',
    src: '/editor-assets/shapes/goalkeepers/point-up.png',
    defaultWidth: 70,
    defaultHeight: 110,
    aiDescription:
      'Portero señalando hacia arriba; indica referencia para salida alta o comunicación',
  },
  {
    assetId: 'gk-walking',
    groupId: 'goalkeepers',
    label: 'Portero caminando',
    src: '/editor-assets/shapes/goalkeepers/walking.png',
    defaultWidth: 70,
    defaultHeight: 105,
    aiDescription:
      'Portero desplazándose caminando; indica trayectoria lenta o reset de posición',
  },

  // ── Porteros — perfiles laterales ──────────────────────────────────────────
  {
    assetId: 'gk-profile-left',
    groupId: 'goalkeepers',
    label: 'Portero perfil izquierdo',
    src: '/editor-assets/shapes/goalkeepers/side-profile-left.png',
    defaultWidth: 85,
    defaultHeight: 100,
    aiDescription: 'Portero en perfil, orientado hacia la izquierda del canvas',
  },
  {
    assetId: 'gk-profile-right',
    groupId: 'goalkeepers',
    label: 'Portero perfil derecho',
    src: '/editor-assets/shapes/goalkeepers/side-profile-right.png',
    defaultWidth: 85,
    defaultHeight: 100,
    aiDescription: 'Portero en perfil, orientado hacia la derecha del canvas',
  },
  {
    assetId: 'gk-back-view',
    groupId: 'goalkeepers',
    label: 'Portero vista trasera',
    src: '/editor-assets/shapes/goalkeepers/back-view.png',
    defaultWidth: 70,
    defaultHeight: 105,
    aiDescription:
      'Portero visto desde atrás, de cara al arco; útil para vista frontal del arco',
  },
  {
    assetId: 'gk-lateral-move',
    groupId: 'goalkeepers',
    label: 'Portero desplazamiento lateral',
    src: '/editor-assets/shapes/goalkeepers/lateral-move.png',
    defaultWidth: 90,
    defaultHeight: 100,
    aiDescription:
      'Portero en desplazamiento lateral; indica movimiento de un palo al otro',
  },
  {
    assetId: 'gk-lateral-adjust',
    groupId: 'goalkeepers',
    label: 'Portero ajuste lateral',
    src: '/editor-assets/shapes/goalkeepers/lateral-adjust.png',
    defaultWidth: 85,
    defaultHeight: 100,
    aiDescription:
      'Portero realizando un ajuste lateral de posición (paso cruzado o desplazamiento fino)',
  },

  // ── Porteros — salidas / paradas ────────────────────────────────────────────
  {
    assetId: 'gk-dive-left',
    groupId: 'goalkeepers',
    label: 'Portero salida palo izquierdo',
    src: '/editor-assets/shapes/goalkeepers/side-dive-up-left.png',
    defaultWidth: 115,
    defaultHeight: 70,
    aiDescription:
      'Portero lanzándose hacia el palo izquierdo (desde la perspectiva del portero)',
  },
  {
    assetId: 'gk-dive-right',
    groupId: 'goalkeepers',
    label: 'Portero salida palo derecho',
    src: '/editor-assets/shapes/goalkeepers/side-dive-up-right.png',
    defaultWidth: 115,
    defaultHeight: 70,
    aiDescription:
      'Portero lanzándose hacia el palo derecho (desde la perspectiva del portero)',
  },
  {
    assetId: 'gk-dive-high',
    groupId: 'goalkeepers',
    label: 'Portero salida alta',
    src: '/editor-assets/shapes/goalkeepers/high-dive.png',
    defaultWidth: 115,
    defaultHeight: 70,
    aiDescription:
      'Portero en salida alta (vuelo lateral en el tercio superior del arco)',
  },
  {
    assetId: 'gk-dive-forward',
    groupId: 'goalkeepers',
    label: 'Portero salida frontal',
    src: '/editor-assets/shapes/goalkeepers/forward-dive.png',
    defaultWidth: 110,
    defaultHeight: 65,
    aiDescription:
      'Portero saliendo frontalmente al suelo (vaselina o desvío a ras de piso)',
  },
  {
    assetId: 'gk-low-save',
    groupId: 'goalkeepers',
    label: 'Portero parada baja',
    src: '/editor-assets/shapes/goalkeepers/low-save.png',
    defaultWidth: 110,
    defaultHeight: 65,
    aiDescription: 'Portero realizando una parada baja a ras de suelo',
  },
  {
    assetId: 'gk-catch',
    groupId: 'goalkeepers',
    label: 'Portero captura',
    src: '/editor-assets/shapes/goalkeepers/catch.png',
    defaultWidth: 80,
    defaultHeight: 105,
    aiDescription:
      'Portero atrapando el balón con ambas manos; útil para ejercicios de recepción',
  },
  {
    assetId: 'gk-clearance',
    groupId: 'goalkeepers',
    label: 'Portero despeje',
    src: '/editor-assets/shapes/goalkeepers/clearance.png',
    defaultWidth: 85,
    defaultHeight: 105,
    aiDescription: 'Portero en acción de despeje con el pie o el puño',
  },

  // ── Porteros — saltos ───────────────────────────────────────────────────────
  {
    assetId: 'gk-jump-vertical',
    groupId: 'goalkeepers',
    label: 'Portero salto vertical',
    src: '/editor-assets/shapes/goalkeepers/vertical-jump.png',
    defaultWidth: 70,
    defaultHeight: 120,
    aiDescription:
      'Portero en salto vertical máximo; útil para ejercicios de potencia y salida alta',
  },
  {
    assetId: 'gk-jump-reach',
    groupId: 'goalkeepers',
    label: 'Portero salto con extensión',
    src: '/editor-assets/shapes/goalkeepers/jump-reach.png',
    defaultWidth: 85,
    defaultHeight: 120,
    aiDescription: 'Portero en salto lateral con extensión máxima de brazos',
  },
  {
    assetId: 'gk-high-stretch',
    groupId: 'goalkeepers',
    label: 'Portero estiramiento alto',
    src: '/editor-assets/shapes/goalkeepers/high-stretch.png',
    defaultWidth: 75,
    defaultHeight: 120,
    aiDescription: 'Portero estirándose en el palo superior del arco',
  },

  // ── Porteros — pases / distribución ────────────────────────────────────────
  {
    assetId: 'gk-long-pass',
    groupId: 'goalkeepers',
    label: 'Portero pase largo',
    src: '/editor-assets/shapes/goalkeepers/long-pass.png',
    defaultWidth: 85,
    defaultHeight: 105,
    aiDescription: 'Portero en posición de pase o saque largo con el pie',
  },
  {
    assetId: 'gk-short-pass',
    groupId: 'goalkeepers',
    label: 'Portero pase corto',
    src: '/editor-assets/shapes/goalkeepers/short-pass.png',
    defaultWidth: 80,
    defaultHeight: 105,
    aiDescription: 'Portero en posición de pase corto con el pie o la mano',
  },

  // ── Jugadores de campo / oponentes ──────────────────────────────────────────
  {
    assetId: 'player-standing',
    groupId: 'goalkeepers',
    label: 'Jugador de campo',
    src: '/editor-assets/shapes/goalkeepers/standing-player.png',
    defaultWidth: 65,
    defaultHeight: 105,
    aiDescription:
      'Jugador de campo (no portero) en posición neutra; útil como asistente o atacante',
  },
  {
    assetId: 'player-opponent',
    groupId: 'goalkeepers',
    label: 'Jugador rival',
    src: '/editor-assets/shapes/goalkeepers/standing-red.png',
    defaultWidth: 65,
    defaultHeight: 105,
    aiDescription:
      'Jugador rival (equipación roja); marca al oponente en ejercicios de presión o 1vs1',
  },

  // ── Balones ─────────────────────────────────────────────────────────────────
  {
    assetId: 'ball',
    groupId: 'balones',
    label: 'Balón de fútbol',
    src: '/editor-assets/shapes/balones/soccer-ball.png',
    defaultWidth: 34,
    defaultHeight: 34,
    aiDescription:
      'Balón de fútbol estándar; marca el punto de disparo o posición del balón',
  },

  // ── Conos ───────────────────────────────────────────────────────────────────
  {
    assetId: 'cone-orange',
    groupId: 'conos',
    label: 'Cono naranja',
    src: '/editor-assets/shapes/conos/orange-cone.png',
    defaultWidth: 42,
    defaultHeight: 56,
    aiDescription:
      'Cono naranja de señalización; el más usado para delimitar rutas y zonas',
  },
  {
    assetId: 'cone-yellow',
    groupId: 'conos',
    label: 'Cono amarillo',
    src: '/editor-assets/shapes/conos/yellow-cone.png',
    defaultWidth: 42,
    defaultHeight: 56,
    aiDescription:
      'Cono amarillo; usa para diferenciar grupos o zonas secundarias',
  },
  {
    assetId: 'cone-blue',
    groupId: 'conos',
    label: 'Cono azul',
    src: '/editor-assets/shapes/conos/blue-cone.png',
    defaultWidth: 42,
    defaultHeight: 56,
    aiDescription:
      'Cono azul; usa para marcar posiciones del portero o puntos de referencia clave',
  },
  {
    assetId: 'cone-red',
    groupId: 'conos',
    label: 'Cono rojo',
    src: '/editor-assets/shapes/conos/red-cone.png',
    defaultWidth: 42,
    defaultHeight: 56,
    aiDescription:
      'Cono rojo; indica zonas de peligro, inicio de sprint o área de disparo',
  },

  // ── Vallas ──────────────────────────────────────────────────────────────────
  {
    assetId: 'hurdle-front',
    groupId: 'vallas',
    label: 'Valla (vista frontal)',
    src: '/editor-assets/shapes/vallas/speed-hurdles-front.png',
    defaultWidth: 80,
    defaultHeight: 55,
    aiDescription:
      'Valla de velocidad vista de frente; para ejercicios de salto frontal',
  },
  {
    assetId: 'hurdle-side',
    groupId: 'vallas',
    label: 'Valla (vista lateral)',
    src: '/editor-assets/shapes/vallas/speed-hurdles-side-left.png',
    defaultWidth: 95,
    defaultHeight: 55,
    aiDescription:
      'Valla de velocidad vista de lado; indica desplazamiento lateral entre vallas',
  },

  // ── Picas / Slalom ──────────────────────────────────────────────────────────
  {
    assetId: 'pole-red',
    groupId: 'picas',
    label: 'Pica roja',
    src: '/editor-assets/shapes/picas/slalom-poles-red.png',
    defaultWidth: 30,
    defaultHeight: 95,
    aiDescription:
      'Pica vertical roja; usa para slaloms, referencias espaciales o circuitos',
  },
  {
    assetId: 'pole-blue',
    groupId: 'picas',
    label: 'Pica azul',
    src: '/editor-assets/shapes/picas/slalom-poles-blue.png',
    defaultWidth: 30,
    defaultHeight: 95,
    aiDescription:
      'Pica vertical azul; usa para contrastar con picas rojas o marcar zonas distintas',
  },

  // ── Aros ────────────────────────────────────────────────────────────────────
  {
    assetId: 'ring-orange',
    groupId: 'aros',
    label: 'Aro naranja',
    src: '/editor-assets/shapes/aros/orange-ring.png',
    defaultWidth: 52,
    defaultHeight: 52,
    aiDescription:
      'Aro plano de coordinación naranja; indica posición exacta de pies o zona de parada',
  },
  {
    assetId: 'ring-blue',
    groupId: 'aros',
    label: 'Aro azul',
    src: '/editor-assets/shapes/aros/blue-ring.png',
    defaultWidth: 52,
    defaultHeight: 52,
    aiDescription:
      'Aro azul de coordinación; usa para diferenciar zonas de trabajo o grupos',
  },
  {
    assetId: 'ring-yellow',
    groupId: 'aros',
    label: 'Aro amarillo',
    src: '/editor-assets/shapes/aros/yellow-ring.png',
    defaultWidth: 52,
    defaultHeight: 52,
    aiDescription: 'Aro amarillo de coordinación',
  },

  // ── Escaleras de coordinación ────────────────────────────────────────────────
  {
    assetId: 'ladder-horizontal',
    groupId: 'escaleras',
    label: 'Escalera horizontal',
    src: '/editor-assets/shapes/escaleras/stairs-gold-center.png',
    defaultWidth: 145,
    defaultHeight: 40,
    aiDescription:
      'Escalera de coordinación horizontal dorada; coloca paralela a la línea de fondo',
  },
  {
    assetId: 'ladder-vertical',
    groupId: 'escaleras',
    label: 'Escalera vertical',
    src: '/editor-assets/shapes/escaleras/stairs-gold-vertical.png',
    defaultWidth: 40,
    defaultHeight: 145,
    aiDescription:
      'Escalera de coordinación en posición vertical; coloca perpendicular a la línea de fondo',
  },
  {
    assetId: 'ladder-diagonal-left',
    groupId: 'escaleras',
    label: 'Escalera diagonal izquierda',
    src: '/editor-assets/shapes/escaleras/stairs-gold-left.png',
    defaultWidth: 110,
    defaultHeight: 80,
    aiDescription:
      'Escalera en diagonal hacia la izquierda; para circuitos con cambio de ángulo',
  },

  // ── Reboteador ───────────────────────────────────────────────────────────────
  {
    assetId: 'rebounder-front',
    groupId: 'reboteador',
    label: 'Reboteador (vista frontal)',
    src: '/editor-assets/shapes/reboteador/rebounder-front.png',
    defaultWidth: 90,
    defaultHeight: 85,
    aiDescription:
      'Reboteador visto de frente; coloca en área pequeña para rebotes en ejercicios de reacción',
  },
  {
    assetId: 'rebounder-side',
    groupId: 'reboteador',
    label: 'Reboteador (vista lateral)',
    src: '/editor-assets/shapes/reboteador/rebounder-left.png',
    defaultWidth: 90,
    defaultHeight: 85,
    aiDescription:
      'Reboteador visto de lado izquierdo; indica la orientación del rebote',
  },
  {
    assetId: 'rebounder-back',
    groupId: 'reboteador',
    label: 'Reboteador (vista trasera)',
    src: '/editor-assets/shapes/reboteador/rebounder-back.png',
    defaultWidth: 90,
    defaultHeight: 85,
    aiDescription:
      'Reboteador visto desde atrás; útil cuando el portero está encarado al arco',
  },

  // ── Muñeco opositor ──────────────────────────────────────────────────────────
  {
    assetId: 'mannequin',
    groupId: 'mu%C3%B1eco',
    label: 'Muñeco opositor',
    src: '/editor-assets/shapes/mu%C3%B1eco/doll.png',
    defaultWidth: 50,
    defaultHeight: 105,
    aiDescription:
      'Muñeco estático de oposición; simula atacantes en ejercicios de blocaje o cobertura',
  },

  // ── Bossu ────────────────────────────────────────────────────────────────────
  {
    assetId: 'bossu',
    groupId: 'bossu',
    label: 'Bossu',
    src: '/editor-assets/shapes/bossu/bossu-red.png',
    defaultWidth: 68,
    defaultHeight: 68,
    aiDescription:
      'Balón bossu hemisférico; para ejercicios de equilibrio, propiocepción y fuerza de core',
  },
];

// ─── Fondos ──────────────────────────────────────────────────────────────────
// Legacy reference kept while the old background set is phased out.
export const LEGACY_CATALOG_BACKGROUNDS: CatalogBackground[] = [
  // ── Vistas frontales del arco ───────────────────────────────────────────────
  {
    backgroundId: 'frontal-1',
    name: 'Vista frontal del arco 1',
    src: '/editor-assets/backgrounds/Frontal1.jpg',
    aiDescription:
      'Vista frontal del arco desde el interior del campo; ideal para ejercicios de salida, blocaje y distribución.',
  },
  {
    backgroundId: 'frontal-2',
    name: 'Vista frontal del arco 2',
    src: '/editor-assets/backgrounds/Frontal2.jpg',
    aiDescription:
      'Vista frontal del arco — variante con perspectiva ligeramente diferente.',
  },

  // ── Área grande — vista lateral ─────────────────────────────────────────────
  {
    backgroundId: 'lateral-area-1',
    name: 'Área grande lateral 1',
    src: '/editor-assets/backgrounds/LateralAreaGrande1.jpg',
    aiDescription:
      'Vista lateral del área grande; ideal para ejercicios de salida al segundo palo, coberturas cortas y 1vs1 lateral.',
  },
  {
    backgroundId: 'lateral-area-2',
    name: 'Área grande lateral 2',
    src: '/editor-assets/backgrounds/LateralAreaGrande2.jpg',
    aiDescription:
      'Vista lateral del área grande — ángulo más abierto. Buena para ejercicios con trayectoria diagonal.',
  },
  {
    backgroundId: 'lateral-area-3',
    name: 'Área grande lateral 3',
    src: '/editor-assets/backgrounds/LateralAreaGrande3.jpg',
    aiDescription:
      'Vista lateral del área grande desde posición elevada; útil para mostrar profundidad del área.',
  },
  {
    backgroundId: 'lateral-area-4',
    name: 'Área grande lateral 4',
    src: '/editor-assets/backgrounds/LateralAreaGrande4.jpg',
    aiDescription: 'Vista lateral del área grande — cuarta variante de ángulo.',
  },
  {
    backgroundId: 'lateral-area-5',
    name: 'Área grande lateral 5',
    src: '/editor-assets/backgrounds/LateralAreaGrande5.jpg',
    aiDescription: 'Vista lateral del área grande — quinta variante.',
  },

  // ── Área grande — vista trasera ─────────────────────────────────────────────
  {
    backgroundId: 'trasera-area-1',
    name: 'Área grande vista trasera 1',
    src: '/editor-assets/backgrounds/TraseraAreaGrande.jpg',
    aiDescription:
      'Vista trasera del área grande (portero de espaldas al área viendo el campo). Ideal para ejercicios de salida de balón, despejes y distribución.',
  },
  {
    backgroundId: 'trasera-area-2',
    name: 'Área grande vista trasera 2',
    src: '/editor-assets/backgrounds/TraseraAreaGrande2.jpg',
    aiDescription: 'Vista trasera del área grande — segunda variante.',
  },

  // ── Medio campo ─────────────────────────────────────────────────────────────
  {
    backgroundId: 'medio-campo-frontal',
    name: 'Medio campo frontal',
    src: '/editor-assets/backgrounds/MedioCampoFrontal.jpg',
    aiDescription:
      'Vista frontal desde el centro del campo; útil para ejercicios de distribución larga y cobertura de espacios amplios.',
  },
  {
    backgroundId: 'medio-campo-lateral',
    name: 'Medio campo lateral',
    src: '/editor-assets/backgrounds/LateralMedioCampo.jpg',
    aiDescription:
      'Vista lateral desde el centro del campo; muestra más espacio vertical para ejercicios de desplazamiento amplio.',
  },

  // ── Corner ──────────────────────────────────────────────────────────────────
  {
    backgroundId: 'corner-1',
    name: 'Zona de córner 1',
    src: '/editor-assets/backgrounds/Corner1.jpg',
    aiDescription:
      'Vista del córner y área desde la banda lateral; ideal para ejercicios de centros, segunda jugada y salida a córner.',
  },
  {
    backgroundId: 'corner-2',
    name: 'Zona de córner 2',
    src: '/editor-assets/backgrounds/Corner2.jpg',
    aiDescription:
      'Vista del córner — ángulo alternativo. Útil para ejercicios de posicionamiento ante centros desde la banda.',
  },

  // ── Zona neutra ─────────────────────────────────────────────────────────────
  {
    backgroundId: 'zona-neutra-1',
    name: 'Zona neutra 1',
    src: '/editor-assets/backgrounds/ZonaNeutra1.jpg',
    aiDescription:
      'Fondo neutro sin líneas de campo; ideal para ejercicios de preparación física, coordinación y circuitos fuera del área.',
  },
  {
    backgroundId: 'zona-neutra-2',
    name: 'Zona neutra 2',
    src: '/editor-assets/backgrounds/ZonaNeutra2.jpg',
    aiDescription:
      'Fondo neutro alternativo; para ejercicios de calentamiento, movilidad o circuitos sin referencia de campo.',
  },
];

// ─── Índices de acceso rápido ─────────────────────────────────────────────────
const normalizeGoalkeeperPathSegment = (value: string) =>
  value.replace(/Ã±/g, '\u00F1');

const buildGoalkeeperSrc = (poseId: string, fileName: string) =>
  `/editor-assets/shapes/goalkeepers/${encodeURIComponent(normalizeGoalkeeperPathSegment(poseId))}/${encodeURIComponent(normalizeGoalkeeperPathSegment(fileName))}`;

export const CATALOG_GOALKEEPER_ASSETS: CatalogAsset[] = [
  {
    assetId: 'gk-pose-01-basica-parado',
    groupId: 'goalkeepers',
    label: 'Basica parado',
    src: buildGoalkeeperSrc('1 basica', 'GK01_BASICA_PARADO_P01_R1.png'),
    defaultWidth: 72,
    defaultHeight: 102,
    aiDescription:
      'Portero en posicion basica de pie, neutral y listo para iniciar la accion.',
  },
  {
    assetId: 'gk-pose-02-hincado',
    groupId: 'goalkeepers',
    label: 'Hincado',
    src: buildGoalkeeperSrc('2  incado', 'GK01_BASICA_INCADO_P01_R1.png'),
    defaultWidth: 76,
    defaultHeight: 94,
    aiDescription:
      'Portero hincado, util para ejercicios de reaccion corta y arranque desde el piso.',
  },
  {
    assetId: 'gk-pose-03-punos-izquierda',
    groupId: 'goalkeepers',
    label: 'Despeje de punos izquierda',
    src: buildGoalkeeperSrc(
      '3 puños izquierda',
      'GK01_DESPEJE_PUNOIZQUIERDO_P01_R1.png',
    ),
    defaultWidth: 86,
    defaultHeight: 108,
    aiDescription:
      'Portero despejando con los punos hacia su lado izquierdo en una accion aerea.',
  },
  {
    assetId: 'gk-pose-04-punos-derecha',
    groupId: 'goalkeepers',
    label: 'Despeje de punos derecha',
    src: buildGoalkeeperSrc(
      '4 puños derecha',
      'GK01_DESPEJE_PUNODERECHO_P01_R1.png',
    ),
    defaultWidth: 86,
    defaultHeight: 108,
    aiDescription:
      'Portero despejando con los punos hacia su lado derecho en una accion aerea.',
  },
  {
    assetId: 'gk-pose-05-guardia-alta',
    groupId: 'goalkeepers',
    label: 'Guardia alta',
    src: buildGoalkeeperSrc('5 arriba', 'GK01_PREPARACION_GUARDIA_P01_R1.png'),
    defaultWidth: 72,
    defaultHeight: 110,
    aiDescription:
      'Portero en guardia alta, preparado para recepciones por arriba del pecho.',
  },
  {
    assetId: 'gk-pose-06-volar-izquierda',
    groupId: 'goalkeepers',
    label: 'Atajada volar izquierda',
    src: buildGoalkeeperSrc(
      '6 atajada volar izquierda',
      'GK01_DESVIO_VOLARIZQUIERDA_P01_R1.png',
    ),
    defaultWidth: 116,
    defaultHeight: 70,
    aiDescription:
      'Portero volando hacia la izquierda para una atajada de extension completa.',
  },
  {
    assetId: 'gk-pose-07-volar-derecha',
    groupId: 'goalkeepers',
    label: 'Atajada volar derecha',
    src: buildGoalkeeperSrc(
      '7  atajada volar derecha',
      'GK01_DESVIO_VOLARDERECHA_P01_R1.png',
    ),
    defaultWidth: 116,
    defaultHeight: 70,
    aiDescription:
      'Portero volando hacia la derecha para una atajada de extension completa.',
  },
  {
    assetId: 'gk-pose-08-barrera-amplia',
    groupId: 'goalkeepers',
    label: 'Barrera amplia',
    src: buildGoalkeeperSrc(
      '8 manos abierta',
      'GK01_ACHIQUE_BARRERAAMPLIA_P01_R1.png',
    ),
    defaultWidth: 92,
    defaultHeight: 104,
    aiDescription:
      'Portero en barrera amplia con manos abiertas, util para achique y bloqueo frontal.',
  },
  {
    assetId: 'gk-pose-09-atajada-aerea-lateral',
    groupId: 'goalkeepers',
    label: 'Atajada aerea lateral',
    src: buildGoalkeeperSrc(
      '9 corriendo',
      'GK01_DESVIO_ATAJADAAEREALATERAL_P01_R1.png',
    ),
    defaultWidth: 82,
    defaultHeight: 108,
    aiDescription:
      'Portero en una atajada aerea lateral, con el cuerpo orientado al desvio.',
  },
  {
    assetId: 'gk-pose-10-extension-x',
    groupId: 'goalkeepers',
    label: 'Atajada extension X',
    src: buildGoalkeeperSrc(
      '10 posicion x',
      'GK01_DESVIO_ATAJADAEXTENSIONX_P01_R1.png',
    ),
    defaultWidth: 104,
    defaultHeight: 96,
    aiDescription:
      'Portero en posicion de extension X para bloquear un remate a corta distancia.',
  },
  {
    assetId: 'gk-pose-11-atajada-baja',
    groupId: 'goalkeepers',
    label: 'Atajada baja',
    src: buildGoalkeeperSrc(
      '11 atajada baja',
      'GK01_BLOCAJE_RECEPCIONBAJA_P01_R1.png',
    ),
    defaultWidth: 72,
    defaultHeight: 110,
    aiDescription:
      'Portero en recepcion baja, preparado para blocar o asegurar un disparo raso.',
  },
  {
    assetId: 'gk-pose-12-manos-extendidas',
    groupId: 'goalkeepers',
    label: 'Atajada manos extendidas',
    src: buildGoalkeeperSrc(
      '12 atajada manos extendidas',
      'GK01_BLOCAJE_BAJOLATERAL_P01_R1.png',
    ),
    defaultWidth: 110,
    defaultHeight: 72,
    aiDescription:
      'Portero en blocaje bajo lateral con ambas manos extendidas hacia el balon.',
  },
  {
    assetId: 'gk-pose-13-salto',
    groupId: 'goalkeepers',
    label: 'Salto',
    src: buildGoalkeeperSrc('13 salto', 'GK01_BLOCAJE_RECEPCIONALTA_P01_R1.png'),
    defaultWidth: 72,
    defaultHeight: 118,
    aiDescription:
      'Portero saltando para una recepcion alta o intercepcion en el juego aereo.',
  },
  {
    assetId: 'gk-pose-14-lado-pierna-levantada',
    groupId: 'goalkeepers',
    label: 'Atajada lado pierna levantada',
    src: buildGoalkeeperSrc(
      '14 atajada lado pierna levantada',
      'GK01_BLOCAJE_DESVIOALTO_P01_R1.png',
    ),
    defaultWidth: 108,
    defaultHeight: 76,
    aiDescription:
      'Portero desviando alto con apoyo lateral y una pierna levantada para ampliar cobertura.',
  },
  {
    assetId: 'gk-pose-15-ataque-suelo',
    groupId: 'goalkeepers',
    label: 'Ataque al suelo',
    src: buildGoalkeeperSrc(
      '15 ataque suelo',
      'GK01_BLOCAJE_ACHIQUE SENTADO_P01_R1.png',
    ),
    defaultWidth: 112,
    defaultHeight: 76,
    aiDescription:
      'Portero atacando el suelo en un achique corto o blocaje muy cercano.',
  },
  {
    assetId: 'gk-pose-16-atrapada-cuclillas',
    groupId: 'goalkeepers',
    label: 'Atrapada en cuclillas',
    src: buildGoalkeeperSrc(
      '16 atrapada cunclillas',
      'GK01_BLOCAJE_ACHIQUE SENTADO_P02_R1.png',
    ),
    defaultWidth: 76,
    defaultHeight: 104,
    aiDescription:
      'Portero en atrapada baja desde cuclillas, util para asegurar balones frontales.',
  },
  {
    assetId: 'gk-pose-17-salto-una-pierna',
    groupId: 'goalkeepers',
    label: 'Salto una pierna',
    src: buildGoalkeeperSrc(
      '17 salto una pierna',
      'GK01_SALTO_UNAPIERNA_P01_R1.png',
    ),
    defaultWidth: 76,
    defaultHeight: 118,
    aiDescription:
      'Portero impulsandose con una sola pierna para trabajo de potencia y coordinacion.',
  },
  {
    assetId: 'gk-pose-18-salto-dos-piernas',
    groupId: 'goalkeepers',
    label: 'Salto dos piernas',
    src: buildGoalkeeperSrc(
      '18 salto dos piernas',
      'GK01_SALTO_DOSPIERNAS_P01_R1.png',
    ),
    defaultWidth: 82,
    defaultHeight: 118,
    aiDescription:
      'Portero en salto con dos piernas, util para trabajo explosivo y blocaje alto.',
  },
  {
    assetId: 'gk-pose-19-bolea-derecha',
    groupId: 'goalkeepers',
    label: 'Saque de bolea derecha',
    src: buildGoalkeeperSrc(
      '19 saque boleo derecha',
      'GK01_DESPEJE_PATADA_P01_R1.png',
    ),
    defaultWidth: 82,
    defaultHeight: 112,
    aiDescription:
      'Portero ejecutando un saque de bolea con perfil orientado a la derecha.',
  },
  {
    assetId: 'gk-pose-20-corriendo',
    groupId: 'goalkeepers',
    label: 'Corriendo',
    src: buildGoalkeeperSrc('20 corriendo', 'GK01_CORRIENDO_TROTAR_P01_R1.png'),
    defaultWidth: 72,
    defaultHeight: 112,
    aiDescription:
      'Portero corriendo o trotando, util para desplazamientos y recuperaciones de posicion.',
  },
  {
    assetId: 'gk-pose-21-pateando',
    groupId: 'goalkeepers',
    label: 'Pateando',
    src: buildGoalkeeperSrc('21 pateando', 'GK01_DESPEJE_PATADA_P02_R1.png'),
    defaultWidth: 84,
    defaultHeight: 112,
    aiDescription:
      'Portero pateando el balon, util para distribucion larga o despeje de juego.',
  },
  {
    assetId: 'gk-pose-22-pierna-al-suelo',
    groupId: 'goalkeepers',
    label: 'Pierna al suelo',
    src: buildGoalkeeperSrc(
      '22 pierna al suelo',
      'GK01_ACHIQUE_BARRERAAMPLIA_P02_R1.png',
    ),
    defaultWidth: 88,
    defaultHeight: 108,
    aiDescription:
      'Portero en barrera amplia con una pierna al suelo, util para cierres y 1vs1.',
  },
  {
    assetId: 'gk-pose-23-saque-mano',
    groupId: 'goalkeepers',
    label: 'Saque con la mano',
    src: buildGoalkeeperSrc(
      '23 saque con la mano',
      'GK01_DESPEJE_CONMANO_P01_R1.png',
    ),
    defaultWidth: 82,
    defaultHeight: 118,
    aiDescription:
      'Portero realizando un saque con la mano para iniciar salida rapida o distribucion corta.',
  },
  {
    assetId: 'gk-pose-24-semivolea',
    groupId: 'goalkeepers',
    label: 'Semivolea',
    src: buildGoalkeeperSrc(
      '24 semivolea',
      'GK01_DESPEJE_SEMIBOLEA_P01_R1.png',
    ),
    defaultWidth: 84,
    defaultHeight: 112,
    aiDescription:
      'Portero en gesto de semivolea para distribucion media o despeje en transicion.',
  },
];

export const CATALOG_ASSETS: CatalogAsset[] = [
  ...CATALOG_GOALKEEPER_ASSETS,
  ...LEGACY_CATALOG_ASSETS.filter((asset) => asset.groupId !== 'goalkeepers'),
];

export const CATALOG_ASSET_BY_ID = new Map<string, CatalogAsset>(
  CATALOG_ASSETS.map((a) => [a.assetId, a]),
);

export const CATALOG_BACKGROUNDS: CatalogBackground[] = [
  {
    backgroundId: 'porteria-frontal',
    name: 'Porteria frontal',
    src: '/editor-assets/backgrounds/PORTERIA_FRONTAL.png',
    aiDescription:
      'Vista frontal de la porteria desde dentro del campo; ideal para ejercicios de salida, blocaje y distribucion.',
  },
  {
    backgroundId: 'porteria-frontal-lejos',
    name: 'Porteria frontal lejana',
    src: '/editor-assets/backgrounds/PORTERIA_FRONTAL_LEJOS.png',
    aiDescription:
      'Vista frontal de la porteria con una camara mas alejada; util para recorridos con mayor profundidad.',
  },
  {
    backgroundId: 'porteria-horizontal-derecho',
    name: 'Porteria horizontal derecha',
    src: '/editor-assets/backgrounds/PORTERIA_HORIZONTAL_DERECHO.png',
    aiDescription:
      'Vista horizontal de la porteria desde el lado derecho; util para coberturas laterales y trayectorias diagonales.',
  },
  {
    backgroundId: 'porteria-horizontal-izquierdo',
    name: 'Porteria horizontal izquierda',
    src: '/editor-assets/backgrounds/PORTERIA_HORIZONTAL_IZQUIERDO.png',
    aiDescription:
      'Vista horizontal de la porteria desde el lado izquierdo; buena para ejercicios con centros, cruces y cambios de apoyo.',
  },
  {
    backgroundId: 'porteria-lateral-derecho',
    name: 'Porteria lateral derecha',
    src: '/editor-assets/backgrounds/PORTERIA_LATERAL_DERECHO.png',
    aiDescription:
      'Vista lateral derecha del area de porteria; ideal para salidas al segundo palo, cierres y 1vs1 lateral.',
  },
  {
    backgroundId: 'porteria-lateral-izquierdo',
    name: 'Porteria lateral izquierda',
    src: '/editor-assets/backgrounds/PORTERIA_LATERAL_IZQUIERDO.png',
    aiDescription:
      'Vista lateral izquierda del area de porteria; util para ejercicios de perfilacion, achique y desplazamiento lateral.',
  },
  {
    backgroundId: 'porteria-lateral-izquierdo-bajo',
    name: 'Porteria lateral izquierda baja',
    src: '/editor-assets/backgrounds/PORTERIA_LATERAL_IZQUIERDO_BAJO.png',
    aiDescription:
      'Vista lateral izquierda en angulo bajo; resalta acciones cercanas al piso y trayectorias rasas.',
  },
  {
    backgroundId: 'porteria-reverso',
    name: 'Porteria reverso',
    src: '/editor-assets/backgrounds/PORTERIA_REVERSO.png',
    aiDescription:
      'Vista reversa de la porteria con el campo al frente; ideal para salidas, despejes y distribucion desde atras.',
  },
  {
    backgroundId: 'zona-neutra-1',
    name: 'Zona neutra 1',
    src: '/editor-assets/backgrounds/ZonaNeutra1.jpg',
    aiDescription:
      'Fondo neutro sin lineas de campo; ideal para preparacion fisica, coordinacion y circuitos fuera del area.',
  },
  {
    backgroundId: 'zona-neutra-2',
    name: 'Zona neutra 2',
    src: '/editor-assets/backgrounds/ZonaNeutra2.jpg',
    aiDescription:
      'Fondo neutro alternativo; util para calentamiento, movilidad o circuitos sin referencias de campo.',
  },
];

export const CATALOG_BACKGROUND_BY_ID = new Map<string, CatalogBackground>(
  CATALOG_BACKGROUNDS.map((b) => [b.backgroundId, b]),
);
