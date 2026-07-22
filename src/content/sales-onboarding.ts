export interface GlossaryItem {
  id: string
  term: string
  definition: string
  bestFor: string
  businessValue: string
  category: 'web' | 'ai' | 'app' | 'data' | 'system'
}

export interface ProductUseCase {
  sector: string
  icon: string
  application: string
  salesHook: string
}

export interface ProductPitch {
  id: string
  product: string
  category: string
  icon: string
  valueFocus: string
  conversationalPitch: string
  idealProfile: string
  useCases: ProductUseCase[]
}

export interface SectorSpeech {
  id: string
  sector: string
  icon: string
  mainPain: string
  pitch: string
  discoveryQuestions: string[]
  preDemoData: string[]
}

export interface ObjectionItem {
  id: string
  objection: string
  reframe: string
  script: string
}

export const WARM_NETWORK_STEPS = [
  {
    step: '1',
    title: 'Identifica Comercios Frecuentes',
    desc: 'Tu clínica dental, el restaurante donde almuerzas, la tienda de ropa de tu zona, la distribuidora donde compras. Conocen tu cara y ya hay confianza.',
  },
  {
    step: '2',
    title: 'Amigos y Familiares con Negocio',
    desc: 'Contacta a conocidos que tengan pymes o cargos gerenciales. Ellos sufren a diario atendiendo llamadas y mensajes a destiempo.',
  },
  {
    step: '3',
    title: 'Ex-compañeros o Contactos Laborales',
    desc: 'Colegas de empleos anteriores o proveedores con los que has tenido buena relación comercial.',
  },
]

export const PRE_DEMO_SCRIPT = {
  title: 'Mensaje para Solicitar Datos antes de la Demo',
  script: `Hola [Nombre], para aprovechar al máximo nuestra llamada de 20 minutos con los fundadores y mostrarte una demostración adaptada a tu negocio, ¿me podrías compartir estos 4 datos sencillos?

1. Nombre comercial de tu empresa y servicios principales.
2. Precios o ticket promedio de tus 2 o 3 productos/servicios más vendidos.
3. Canal por donde te escriben la mayoría de tus clientes (WhatsApp, Instagram o Web).
4. ¿En qué horario u ocasión sienten que se les escapan más ventas o consultas?

Con esto preparamos un prototipo interactivo en vivo con los datos reales de tu marca antes de nuestra reunión.`,
  why: 'Con estos 4 datos, los fundadores pre-configuran la demo interactiva en vivo para que el cliente vea responder a su propia marca durante la reunión de Zoom.',
}

export const PRODUCT_GLOSSARY: GlossaryItem[] = [
  {
    id: 'landing',
    term: 'Landing Page / One Page',
    category: 'web',
    definition: 'Página web estratégica enfocada en una sola oferta o servicio comercial sin menús distractores.',
    bestFor: 'Lanzamiento de productos únicos, campañas de publicidad en Google/Instagram, eventos o servicios específicos.',
    businessValue: 'Concentra la atención del visitante en un único botón de contacto, multiplicando la tasa de conversión respecto a un sitio tradicional.',
  },
  {
    id: 'corporate-web',
    term: 'Website Corporativo Multi-página',
    category: 'web',
    definition: 'Portal institucional completo con historia, catálogo detallado de servicios, equipo y sección de contacto.',
    bestFor: 'Consultoras, clínicas de especialidades, empresas de ingeniería, firmas B2B corporativas.',
    businessValue: 'Otorga autoridad de marca, confianza e institucionalidad necesaria para cerrar contratos B2B de alto valor.',
  },
  {
    id: 'ecommerce',
    term: 'Smart Commerce (Tienda Online)',
    category: 'web',
    definition: 'Catálogo de productos digital con carrito de compra integrado, pasarela de pago y confirmación de pedido.',
    bestFor: 'Tiendas de ropa, accesorios, repuestos, insumos de belleza y consumo masivo.',
    businessValue: 'Tu tienda vendiendo de forma automática 24/7 sin depender de personal de mostrador para tomar datos de envío o cobrar.',
  },
  {
    id: 'chatbot-ai',
    term: 'AI Sales Engine (Chatbot de Ventas 24/7)',
    category: 'ai',
    definition: 'Asistente virtual inteligente en WhatsApp entrenado con los productos, precios y horarios del negocio.',
    bestFor: 'Clínicas (agendar citas), Distribuidoras (tomar pedidos), Inmobiliarias, Empresas de Servicios.',
    businessValue: 'Responde en menos de 60 segundos a las 2 AM, califica al cliente y agenda la venta antes de que consulte a la competencia.',
  },
  {
    id: 'pwa',
    term: 'PWA (Progressive Web App) / Software a Medida',
    category: 'app',
    definition: 'Aplicación rápida e instalable en celulares y PC que funciona como software de gestión operativa.',
    bestFor: 'Catering/Restaurantes (control de producción), empresas con personal en campo, logística y talleres.',
    businessValue: 'Ahorro directo de hasta 30% en costos operativos/materia prima y control total de procesos en tiempo real desde el teléfono.',
  },
  {
    id: 'crm',
    term: 'CRM (Panel de Control de Clientes)',
    category: 'system',
    definition: 'Sistema donde se registra cada cliente potencial desde que pregunta hasta que paga o cierra.',
    bestFor: 'Equipos comerciales, empresas con más de 10 mensajes diarios o negocios multi-vendedor.',
    businessValue: 'Cero leads olvidados en celulares personales; visibilidad total para el dueño sobre la gestión de su fuerza de ventas.',
  },
  {
    id: 'dashboard',
    term: 'Dashboard de Métricas en Vivo',
    category: 'data',
    definition: 'Pantalla gráfica con los indicadores clave del negocio (ventas de hoy, comisiones, tiempo de respuesta).',
    bestFor: 'Dueños de pymes, gerentes generales y directores multi-sede.',
    businessValue: 'Tomar decisiones estratégicas con números reales de hoy, no con aproximaciones a fin de mes.',
  },
]

export const PRODUCT_PITCHES: ProductPitch[] = [
  {
    id: 'pitch-web',
    product: 'Websites & Landing Pages (Smart Presence)',
    category: 'Presencia Digital & Imagen',
    icon: '🌐',
    valueFocus: 'Imagen profesional, confianza instantánea y captación de clientes de alto ticket.',
    conversationalPitch: '“Hola [Nombre], estuve viendo tu negocio y me parece excelente lo que hacen. Sin embargo, hoy muchos clientes deciden a quién comprarle evaluando qué tan seria se ve su web. Nosotros diseñamos sitios de alta conversión pensados para captar clientes directo a WhatsApp o formulario, sin menús confusos. Me gustaría agendar 20 minutos con nuestros fundadores para mostrarte cómo se vería una propuesta diseñada específicamente para ustedes.”',
    idealProfile: 'Empresas B2B, consultorías, firmas legales, clínicas de especialidad y servicios profesionales.',
    useCases: [
      {
        sector: 'Firma Legal o Consultora B2B',
        icon: '⚖️',
        application: 'Sitio corporativo institucional que transmite solvencia y genera solicitudes de cotización directa.',
        salesHook: '“Una web corporativa seria te permite justificar tarifas premium y cerrar contratos B2B con empresas exigentes.”',
      },
      {
        sector: 'Clínica Odontológica o Estética',
        icon: '🩺',
        application: 'Landing page optimizada para campañas de Google Ads enfocada en un tratamiento estrella (ej: implantes).',
        salesHook: '“Toda la publicidad va dirigida a un botón de WhatsApp sin distracciones, triplicando la cita médica.”',
      },
      {
        sector: 'Arquitectura & Construcción',
        icon: '📐',
        application: 'Portafolio interactivo de proyectos finalizados con cotizador rápido de m².',
        salesHook: '“El cliente ve tus obras anteriores en HD y solicita cotización sin hacer perder tiempo a tus ingenieros.”',
      },
    ],
  },
  {
    id: 'pitch-ecommerce',
    product: 'Tienda Online & Catálogo Digital (Smart Commerce)',
    category: 'Ventas Automáticas 24/7',
    icon: '🛒',
    valueFocus: 'Vender a cualquier hora sin perder tiempo respondiendo precios o enviando fotos por privado.',
    conversationalPitch: '“Hola [Nombre], noté que en su tienda reciben bastantes preguntas por Instagram o WhatsApp sobre precios y modelos. El problema es que mientras responden uno a uno por mensaje, muchos clientes se desesperan y compran en otro lado. Creamos tiendas online rápidas e integradas a WhatsApp donde el cliente arma su pedido, ve la disponibilidad y paga solo, incluso a las 11 de la noche. ¿Te parece bien si agendamos 20 minutos con nuestros fundadores para mostrarte un prototipo adaptado a tus productos?”',
    idealProfile: 'Tiendas de ropa, repuestos, calzado, tecnología, cosmética y comercios con catálogo amplio.',
    useCases: [
      {
        sector: 'Tiendas de Ropa & Moda (Retail)',
        icon: '👗',
        application: 'Catálogo de productos por tallas y colores con carrito de compra directo a WhatsApp o pasarela.',
        salesHook: '“Elimina el responder \'precio por privado\'. Tus clientes compran directo a las 11 PM viendo tallas en vivo.”',
      },
      {
        sector: 'Ferreterías & Materiales de Construcción',
        icon: '🛠️',
        application: 'Buscador de herramientas e insumos por categorías para maestros de obra y compras rápidas.',
        salesHook: '“Los contratistas hacen el pedido de sacos de cemento o herramientas desde la obra sin hacer fila en caja.”',
      },
      {
        sector: 'Venta de Repuestos Automotrices',
        icon: '🚗',
        application: 'Filtro por marca, modelo y año del vehículo para encontrar la pieza exacta.',
        salesHook: '“El cliente encuentra el repuesto de su auto en segundos sin hacer preguntas repetitivas.”',
      },
      {
        sector: 'Cosmética & Belleza',
        icon: '💄',
        application: 'Catálogo visual con ventas cruzadas (sugerencia de kit completo al agregar un labial).',
        salesHook: '“Aumenta el ticket promedio sugiriendo productos complementarios de forma automática antes del pago.”',
      },
    ],
  },
  {
    id: 'pitch-ai-sales',
    product: 'Agente IA para WhatsApp (AI Sales Engine)',
    category: 'Ingeniería de Ventas con IA',
    icon: '🤖',
    valueFocus: 'Respuesta en menos de 60 segundos 24/7, filtro de curiosos y agendamiento automático.',
    conversationalPitch: '“Hola [Nombre], sabemos que en negocios como el tuyo el mayor cuello de botella es que llegan mensajes a toda hora y es imposible responder al instante. Desarrollamos un asistente inteligente de WhatsApp que saluda a tus clientes en menos de 60 segundos, les da información exacta de precios y deja la cita o el pedido agendado en tu CRM. Me gustaría coordinar una sesión de 20 minutos con nuestro equipo fundador para mostrarte la demo en vivo respondiendo con los datos de tu empresa.”',
    idealProfile: 'Clínicas, distribuidoras mayoristas, servicios de urgencia, inmobiliarias y academias.',
    useCases: [
      {
        sector: 'Ferreterías & Insumos de Mostrador',
        icon: '🔩',
        application: 'Responde precios de materiales, disponibilidad de stock y ubicación de la tienda en 15 segundos.',
        salesHook: '“Atiende las consultas de precio al instante mientras tus vendedores presenciales atienden el mostrador.”',
      },
      {
        sector: 'Clínicas & Centros Médicos',
        icon: '🩺',
        application: 'Informa especialidades, precio de consulta y agendan la cita médica según el horario del especialista.',
        salesHook: '“Cero pacientes perdidos de noche o fines de semana; la agenda se llena sola en automático.”',
      },
      {
        sector: 'Inmobiliarias & Bienes Raíces',
        icon: '🏢',
        application: 'Filtra interesados según presupuesto, zona deseada y número de dormitorios antes de pasar al asesor.',
        salesHook: '“Tus corredores solo hablan con clientes calificados que realmente tienen el dinero para alquilar/comprar.”',
      },
      {
        sector: 'Estéticas, Barberías & Spas',
        icon: '💈',
        application: 'Muestra servicios, precios y reserva el turno disponible con el especialista elegido.',
        salesHook: '“Tus clientes agendan sus cortes o tratamientos sin que la recepcionista tenga que atender llamadas.”',
      },
    ],
  },
  {
    id: 'pitch-pwa-software',
    product: 'PWA & Software de Gestión a Medida',
    category: 'Control Operativo & Ahorro',
    icon: '⚡',
    valueFocus: 'Eliminar el papel/Excel, reducir costos de materia prima y controlar la operación desde el celular.',
    conversationalPitch: '“Hola [Nombre], muchos negocios pierden entre un 15% y 30% de su margen por llevar inventarios o cálculos de producción en hojas de papel o Excel desordenadas. Construimos aplicaciones web a medida (PWA) que tus empleados usan desde el teléfono en 2 minutos para registrar stock, insumos o despachos en tiempo real. Te invito a una llamada de 20 minutos con nuestros fundadores para mostrarte el caso real de Cocinerhosp en 6 sedes y ver cómo digitalizar tu operación.”',
    idealProfile: 'Catering, restaurantes, distribuidoras con choferes/personal en campo, talleres e industrias.',
    useCases: [
      {
        sector: 'Restaurantes, Alimentos & Catering',
        icon: '🍳',
        application: 'Cálculo automatizado de recetas y materia prima exacta desde el celular del chef (Caso Cocinerhosp).',
        salesHook: '“Reduce hasta un 30% el desperdicio de insumos en cocina calculando porciones exactas en 2 minutos.”',
      },
      {
        sector: 'Talleres Mecánicos & Servicios Técnicos',
        icon: '🔧',
        application: 'Recepción de vehículos con fotos desde la tablet del mecánico y consulta de estado en tiempo real para el cliente.',
        salesHook: '“El cliente consulta el estado de su auto por WhatsApp sin llamar al taller a cada rato.”',
      },
      {
        sector: 'Distribuidoras con Choferes / Campo',
        icon: '🚚',
        application: 'App instalable en los teléfonos del equipo de entregas para confirmar despachos, cobros y firmas.',
        salesHook: '“Control total de qué chofer entregó la mercancía y cobró la factura en tiempo real.”',
      },
    ],
  },
  {
    id: 'pitch-crm-metrics',
    product: 'CRM Integrado & Dashboard de Control',
    category: 'Visibilidad & Cero Leads Perdidos',
    icon: '📊',
    valueFocus: 'Control total de la fuerza de ventas, métricas en tiempo real y seguimiento sin descuidos.',
    conversationalPitch: '“Hola [Nombre], cuando un negocio crece, es muy fácil que los vendedores olviden hacer seguimiento a prospectos que preguntaron la semana pasada. Nuestro CRM registra automáticamente cada conversación y te muestra en una sola pantalla gráfica cuántas cotizaciones hay abiertas, cuánto dinero hay en juego y qué vendedor está respondiendo más rápido. Agendemos 20 minutos con nuestros fundadores para mostrarte cómo luce el panel gerencial.”',
    idealProfile: 'Dueños de pymes con equipo comercial, gerentes generales y directores multi-sede.',
    useCases: [
      {
        sector: 'Equipos de Venta Multi-Vendedor',
        icon: '👥',
        application: 'Monitoreo de tiempos de respuesta por vendedor y reasignación automática de prospectos fríos.',
        salesHook: '“El dueño ve en su celular quién está respondiendo los leads y qué vendedor necesita apoyo.”',
      },
      {
        sector: 'Distribuidoras B2B & Reorden Recurrente',
        icon: '📦',
        application: 'Alertas automáticas cuando una bodega o cliente recurrente lleva más de 15 días sin volver a pedir.',
        salesHook: '“El sistema te avisa antes de que el cliente le empiece a comprar a tu competidor.”',
      },
    ],
  },
]

export const SECTOR_SPEECHES: SectorSpeech[] = [
  {
    id: 'clinicas',
    sector: 'Clínicas y Centros Médicos',
    icon: '🩺',
    mainPain: 'Líneas saturadas, llamadas perdidas y recepcionistas ocupadas en horario de consulta.',
    pitch: '“Hola [Nombre], sabemos que en las clínicas el mayor dolor es perder pacientes porque la línea está ocupada o la recepcionista está atendiendo un cuadro presencial. Implementamos un asistente de WhatsApp que responde en 60 segundos, informa las especialidades, el costo de la consulta y deja la cita agendada de forma automática. ¿Podemos agendar 20 minutos con nuestros fundadores para mostrarte un prototipo funcionando en vivo con los precios de tu clínica?”',
    discoveryQuestions: [
      '¿Cuántas consultas o pacientes pierden al día por no responder fuera de horario o cuando la recepción está llena?',
      '¿Tienen precios fijos por especialidad o varían según el médico?',
    ],
    preDemoData: [
      'Nombre de la clínica y especialidades principales',
      'Precio promedio de consulta inicial',
      'Horarios de atención de recepción',
    ],
  },
  {
    id: 'distribuidoras',
    sector: 'Distribuidoras y Mayoristas',
    icon: '📦',
    mainPain: 'Clientes pidiendo listas de precios en PDF por WhatsApp y vendedores enviando cotizaciones a mano.',
    pitch: '“Hola [Nombre], en las distribuidoras el equipo pierde horas enviando catálogos en PDF y respondiendo si hay stock de harina, aceite o insumos. Creamos un sistema donde el cliente escribe al WhatsApp de la distribuidora, ve el catálogo actualizado en tiempo real, suma el pedido y genera la orden de pago sin que tu vendedor mueva un dedo. Te invito a una sesión de 20 minutos con nuestro equipo fundador para mostrarte cómo se automatizan los pedidos de tu lista actual.”',
    discoveryQuestions: [
      '¿Cuál es el pedido mínimo para entrega a domicilio que manejan?',
      '¿Qué medios de pago aceptan frecuentemente (Zelle, Pago Móvil, Transferencia)?',
    ],
    preDemoData: [
      'Nombre de la distribuidora y línea de productos estrella',
      'Monto mínimo de pedido',
      'Zonas de cobertura de delivery',
    ],
  },
  {
    id: 'retail',
    sector: 'Tiendas de Ropa y Retail',
    icon: '👗',
    mainPain: 'Responder "precio por privado" o perder clientes que preguntan disponibilidad de tallas de noche.',
    pitch: '“Hola [Nombre], en retail el 60% de los mensajes llegan de noche cuando la tienda está cerrada. Si el cliente no ve la talla o el precio de inmediato, le compra a otro comercio. Con nuestro Smart Commerce y Agente de WhatsApp, el cliente consulta tallas, precios y hace la compra directa aunque sean las 11 PM. ¿Te parece bien si agendamos 20 minutos esta semana para mostrarte el prototipo adaptado a tu marca?”',
    discoveryQuestions: [
      '¿Qué porcentaje de sus ventas viene por Instagram o WhatsApp actualmente?',
      '¿Tienen envíos nacionales o entregas en 24 horas?',
    ],
    preDemoData: [
      'Nombre de la tienda y tipo de prendas/accesorios',
      'Rango de precios de las prendas más vendidas',
      'Métodos de envío disponibles',
    ],
  },
  {
    id: 'restaurantes',
    sector: 'Restaurantes, Catering y Alimentos',
    icon: '🍳',
    mainPain: 'Desperdicio de materia prima, errores en recetas/pedidos a mano y sobrecostos de producción.',
    pitch: '“Hola [Nombre], en el sector de alimentos el dinero se escapa en la cocina por compras de más y pedidos calculados en papel. Diseñamos un sistema web (PWA) donde el equipo calcula la producción exacta desde su celular en 2 minutos y reduce hasta un 30% el desperdicio de insumos. Nos gustaría agendar 20 minutos con nuestros fundadores para mostrarte el caso real de Cocinerhosp en 6 sedes y cómo aplicarlo en tu negocio.”',
    discoveryQuestions: [
      '¿Cómo calculan actualmente la compra diaria de insumos o la producción de platos/menús?',
      '¿Tienen varias sedes o centro de producción centralizado?',
    ],
    preDemoData: [
      'Nombre de la empresa de catering/restaurante',
      'Número de sedes o cocinas',
      'Plato o servicio con mayor volumen',
    ],
  },
  {
    id: 'consultoras',
    sector: 'Consultoras y Servicios B2B',
    icon: '💼',
    mainPain: 'Reuniones con prospectos curiosos sin presupuesto que hacen perder tiempo al consultor.',
    pitch: '“Hola [Nombre], como firma de servicios el activo más caro es tu tiempo en reuniones con personas que no pueden pagar tus honorarios. Nuestro sistema califica al prospecto en WhatsApp según su presupuesto y tipo de proyecto antes de agendar. Así, cuando entras a una llamada de Zoom, sabes que es un cliente calificado listo para negociar. Agendemos 20 minutos con nuestros fundadores y te mostramos cómo filtrar tus prospectos en automático.”',
    discoveryQuestions: [
      '¿Cuánto tiempo inviertes a la semana en llamadas con personas que al final no compran?',
      '¿Cuál es el ticket promedio de tus servicios?',
    ],
    preDemoData: [
      'Nombre de la firma/agencia y servicios principales',
      'Ticket promedio por proyecto',
      'Perfil ideal de cliente',
    ],
  },
]

export const OBJECTIONS: ObjectionItem[] = [
  {
    id: 'expensive',
    objection: '“Es muy caro / No tengo presupuesto ahora”',
    reframe: 'Enfocar la conversación en el costo de la inacción y el uso del Cotizador para dar un rango exacto a su medida.',
    script: '“Entiendo perfectamente. Justo por eso trabajamos con un Cotizador por rangos muy flexible. No vendemos software inflado, sino únicamente los módulos que hoy te generan dinero. En la reunión de 20 minutos con los fundadores revisamos tu caso y te armamos un presupuesto exacto a tu alcance. ¿Te queda mejor mañana en la mañana o en la tarde?”',
  },
  {
    id: 'whatsapp-manual',
    objection: '“Ya tengo WhatsApp y mi empleada responde cuando puede”',
    reframe: 'Demostrar la diferencia entre respuesta tardía vs respuesta en 60 segundos 24/7.',
    script: '“Excelente que ya tengan el canal activo. El problema surge cuando llegan 5 mensajes al mismo tiempo o cuando escriben a las 9 PM. Según las estadísticas, si un prospecto no recibe respuesta en 60 segundos, el 80% le escribe al siguiente competidor. La IA no reemplaza a tu empleada, le quita el trabajo repetitivo para que ella se enfoque en clientes de alto valor. Te lo mostramos en vivo en 20 minutos.”',
  },
  {
    id: 'fear-ai',
    objection: '“Tengo miedo de que la IA responda mal o confunda al cliente”',
    reframe: 'Tranquilizar explicando que la IA se entrena ÚNICAMENTE con las reglas estrictas del cliente.',
    script: '“Es un temor super válido. Por eso nuestras soluciones de IA no inventan respuestas: se alimentan exclusivamente de tus precios, tus políticas y tus reglas. Además, si el cliente tiene una duda muy compleja, la IA lo transfiere de inmediato a tu equipo humano con una notificación. En la llamada de 20 minutos te hacemos una prueba en directo para que veas la precisión.”',
  },
  {
    id: 'send-info',
    objection: '“Mándame la información por escrito / un folleto en PDF”',
    reframe: 'Personalización de la oferta: un PDF genérico no le dice nada.',
    script: '“Con mucho gusto te envío la información general, pero como cada negocio tiene procesos diferentes, un PDF no te diría cómo aplica a tu caso. Por eso la llamada dura solo 20 minutos: los fundadores te muestran el sistema adaptado a tu sector y sales con números claros. ¿Cuándo tienes un espacio disponible esta semana?”',
  },
  {
    id: 'existing-agency',
    objection: '“Ya tenemos página web / agencia que maneja nuestras redes”',
    reframe: 'Diferenciar presencia visual pasiva vs captación y agendamiento automatizado en <60s.',
    script: '“¡Buenísimo que ya tengan presencia digital activa! Sin embargo, la mayoría de agencias se enfoca en imagen o likes, no en captar y agendar al prospecto en menos de 60 segundos por WhatsApp. Nosotros nos conectamos a lo que ya tienen para convertir ese tráfico en clientes reales. En 20 minutos te mostramos la diferencia con su web actual.”',
  },
  {
    id: 'no-time',
    objection: '“No tengo tiempo para reuniones ni llamadas esta semana”',
    reframe: 'Respeto al tiempo y foco en el ahorro de horas operativas semanales.',
    script: '“Entiendo perfectamente que estés a tope de trabajo, justo por eso este sistema está diseñado para devolverte horas operativas a la semana. La llamada dura exactamente 20 minutos por reloj, vemos el prototipo en vivo y tú decides si tiene sentido. ¿Te acomoda mejor mañana a primera hora o al final de la tarde?”',
  },
  {
    id: 'traditional-clients',
    objection: '“Nuestros clientes son tradicionales / prefieren hablar por teléfono o presencial”',
    reframe: 'Aclarar que la tecnología no elimina la atención presencial, sino que atiende fuera de horario.',
    script: '“Es totalmente cierto que el trato humano es irreemplazable para cerrar. Pero incluso los clientes tradicionales agradecen no tener que esperar horas para saber si hay disponibilidad o precios a las 8 PM. El sistema solo filtra y agenda para que tú o tu equipo atiendan al cliente listo para comprar.”',
  },
  {
    id: 'bad-experience',
    objection: '“Tuvimos una mala experiencia antes con otra empresa de software o agencia”',
    reframe: 'Demostrar transparencia con entregables semanales y el Cotizador sin sorpresas.',
    script: '“Lamento mucho esa mala experiencia, lamentablemente abundan promesas infladas en el mercado. En nexdevp trabajamos con iteraciones semanales, entregables visibles desde la primera semana y precios transparentes. En la sesión de 20 minutos ves el prototipo funcionando antes de comprometer un solo centavo.”',
  },
  {
    id: 'talk-to-partner',
    objection: '“Quiero hablarlo primero con mi socio o director”',
    reframe: 'Invitar al socio a la reunión de diagnóstico para resolver dudas en vivo juntos.',
    script: '“¡Excelente idea! De hecho es mucho mejor que tu socio se sume a la llamada de 20 minutos para que ambos vean la demostración en directo y resuelvan dudas juntos con nuestros fundadores. ¿Qué día de esta semana les queda cómodo a los dos?”',
  },
  {
    id: 'complex-business',
    objection: '“Mi negocio es muy complejo y diferente a los demás”',
    reframe: 'Explicar que no vendemos plantillas rígidas sino desarrollo y lógica a la medida exacta.',
    script: '“Totalmente de acuerdo, por eso no vendemos plantillas rígidas de mercado. Desarrollamos la lógica a la medida exacta de tus procesos de negocio. En la reunión de 20 minutos revisamos esa complejidad puntual y te mostramos cómo se adapta nuestro sistema.”',
  },
]
