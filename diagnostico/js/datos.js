/* =========================================================
   ENGRANA · Diagnóstico de Automatización
   datos.js — ÚNICA fuente de textos y reglas del diagnóstico.

   Aquí están las preguntas, respuestas, dimensiones, niveles,
   oportunidades y recomendaciones. Si quieres cambiar un texto,
   cámbialo aquí: la interfaz, el motor de cálculo, el formulario
   y las pruebas automáticas lo leen de este archivo.

   Puntuación: opción A = 0, B = 1, C = 2, D = 3.
   Una puntuación alta indica más procesos manuales y, por tanto,
   más oportunidades potenciales de automatización. Es un
   indicador orientativo, no una auditoría técnica.
   ========================================================= */
(function (root, factory) {
  var datos = factory();
  if (typeof module === "object" && module.exports) module.exports = datos;
  else root.EngranaDiagDatos = datos;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LETRAS = ["A", "B", "C", "D"];

  /* ---------- Contexto (opcional, antes de las preguntas) ---------- */
  var sectores = [
    { id: "distribucion", nombre: "Distribución y suministros",
      contexto: "En distribución y suministros, este punto suele notarse en pedidos con muchas referencias, consultas de precio y plazos que dependen de proveedores." },
    { id: "industria", nombre: "Industria y fabricación",
      contexto: "En industria y fabricación, suele notarse en la coordinación entre pedidos, producción y entregas." },
    { id: "construccion", nombre: "Construcción y reformas",
      contexto: "En construcción y reformas, suele notarse en presupuestos por obra, pedidos de material y seguimiento de cada trabajo." },
    { id: "transporte", nombre: "Transporte y logística",
      contexto: "En transporte y logística, suele notarse en la recepción de servicios, la asignación de recursos y el control de cada entrega." },
    { id: "comercio", nombre: "Comercio",
      contexto: "En comercio, suele notarse en pedidos de clientes, reposición y comunicación con proveedores." },
    { id: "hosteleria", nombre: "Hostelería",
      contexto: "En hostelería, suele notarse en reservas, pedidos a proveedores y tareas administrativas que se acumulan fuera del servicio." },
    { id: "servicios", nombre: "Servicios profesionales",
      contexto: "En servicios profesionales, suele notarse en la entrada de solicitudes, las propuestas y el seguimiento de cada cliente." },
    { id: "otros", nombre: "Otros", contexto: "" }
  ];

  var tamanos = [
    { id: "1-5", nombre: "1-5 trabajadores",
      contexto: "Con un equipo reducido, cada tarea repetitiva resta tiempo a pocas personas: conviene empezar por el flujo que más se repite." },
    { id: "6-10", nombre: "6-10 trabajadores",
      contexto: "Con varias personas implicadas, tener un único lugar de referencia evita depender de quién recuerda cada cosa." },
    { id: "11-25", nombre: "11-25 trabajadores",
      contexto: "Con varias personas implicadas, tener un único lugar de referencia evita depender de quién recuerda cada cosa." },
    { id: "26-50", nombre: "26-50 trabajadores",
      contexto: "En equipos más amplios, la coordinación entre departamentos y la visibilidad del estado de cada operación ganan peso." },
    { id: "50+", nombre: "Más de 50 trabajadores",
      contexto: "En equipos más amplios, la coordinación entre departamentos y la visibilidad del estado de cada operación ganan peso." }
  ];

  /* ---------- Dimensiones (2 preguntas cada una, máximo 6 puntos) ---------- */
  var dimensiones = [
    { id: "solicitudes", nombre: "Gestión de solicitudes", nombreLargo: "Recepción y gestión de solicitudes", preguntas: [0, 1],
      oportunidad: { titulo: "Centralizar los pedidos",
        texto: "Una primera mejora podría consistir en reunir las solicitudes de diferentes canales en un único sistema, registrar automáticamente los datos y facilitar su seguimiento." } },
    { id: "presupuestos", nombre: "Presupuestos y documentos", nombreLargo: "Presupuestos y documentación", preguntas: [2, 3],
      oportunidad: { titulo: "Reducir tareas repetitivas en la preparación de ofertas",
        texto: "Podría ser interesante conectar la información comercial con plantillas de presupuestos y documentos para evitar introducir varias veces los mismos datos." } },
    { id: "seguimiento", nombre: "Seguimiento comercial", nombreLargo: "Seguimiento comercial", preguntas: [4, 5],
      oportunidad: { titulo: "Ordenar el seguimiento de clientes",
        texto: "Un sistema de tareas y avisos automáticos podría facilitar que las oportunidades comerciales tengan un seguimiento más consistente." } },
    { id: "informacion", nombre: "Información y control", nombreLargo: "Información y control", preguntas: [6, 7],
      oportunidad: { titulo: "Conectar herramientas y centralizar información",
        texto: "Podría tener sentido integrar las aplicaciones que utiliza tu empresa y disponer de un panel que facilite consultar la información." } }
  ];

  /* Oportunidad cuando ninguna dimensión suma puntos */
  var oportunidadSinPrioridad = {
    titulo: "Mantener los procesos conectados",
    texto: "Tus respuestas no señalan un área prioritaria. Aun así, conviene revisar cada cierto tiempo qué tareas han vuelto a hacerse a mano a medida que la empresa crece."
  };

  /* ---------- Preguntas ---------- */
  var preguntas = [
    { id: "p1", tema: "Recepción de pedidos y solicitudes",
      texto: "¿Cómo recibe actualmente tu empresa los pedidos o solicitudes de clientes?",
      opciones: [
        "Llegan a través de un sistema centralizado y quedan registrados automáticamente.",
        "Principalmente por correo electrónico o formularios, y después se registran en un sistema.",
        "Llegan por diferentes canales y alguien debe introducirlos manualmente.",
        "Llegan por WhatsApp, teléfono, correo y otros medios, y se gestionan manualmente."
      ] },
    { id: "p2", tema: "Registro de información",
      texto: "Cuando llega una nueva solicitud, ¿qué ocurre con la información?",
      opciones: [
        "Se registra, clasifica y asigna automáticamente a la persona correspondiente.",
        "Se registra en un programa común, aunque requiere intervención manual.",
        "Un empleado debe copiar los datos a una hoja de cálculo o aplicación.",
        "La información se reparte entre mensajes, correos, llamadas y notas."
      ] },
    { id: "p3", tema: "Presupuestos y documentación",
      texto: "¿Cómo prepara tu empresa los presupuestos y documentos comerciales?",
      opciones: [
        "Se generan automáticamente a partir de información centralizada y validada.",
        "Se utilizan plantillas que requieren algunos pasos manuales.",
        "Hay que copiar datos, modificar documentos y revisar varias versiones.",
        "Se preparan prácticamente desde cero y se repite mucha información."
      ] },
    { id: "p4", tema: "Repetición de tareas",
      texto: "¿Cuánto trabajo supone introducir varias veces los mismos datos?",
      opciones: [
        "La información se registra una sola vez y se reutiliza en los diferentes procesos.",
        "Algunas aplicaciones están conectadas, pero todavía hay tareas manuales.",
        "Se copian habitualmente datos entre herramientas distintas.",
        "Los empleados tienen que repetir constantemente la misma información."
      ] },
    { id: "p5", tema: "Seguimiento comercial",
      texto: "¿Cómo realiza tu equipo el seguimiento de clientes y presupuestos?",
      opciones: [
        "El sistema crea recordatorios y tareas automáticamente.",
        "Se utiliza un CRM o sistema común, pero el seguimiento depende de cada comercial.",
        "Se utilizan hojas de cálculo y recordatorios manuales.",
        "El seguimiento depende principalmente de que cada persona recuerde contactar con el cliente."
      ] },
    { id: "p6", tema: "Control de operaciones",
      texto: "¿Cómo sabes en qué estado se encuentra cada pedido, presupuesto o solicitud?",
      opciones: [
        "Existe un panel actualizado que permite consultar el estado de todo.",
        "Hay un sistema común, pero necesita actualizaciones manuales.",
        "Hay diferentes hojas de cálculo, correos y documentos.",
        "Normalmente tienes que preguntar a otras personas o buscar conversaciones para averiguarlo."
      ] },
    { id: "p7", tema: "Conexión entre herramientas",
      texto: "¿Tus programas y aplicaciones comparten automáticamente la información?",
      opciones: [
        "La mayoría de herramientas están conectadas y comparten datos.",
        "Tenemos algunas integraciones, pero no están todos los procesos conectados.",
        "La mayoría de las herramientas funcionan independientemente.",
        "Los empleados tienen que trasladar información manualmente entre diferentes programas."
      ] },
    { id: "p8", tema: "Informes y control del negocio",
      texto: "¿Cómo obtiene la dirección información sobre el funcionamiento de la empresa?",
      opciones: [
        "Disponemos de paneles e informes que se actualizan automáticamente.",
        "Podemos obtener informes desde el sistema, aunque hay que revisarlos o prepararlos.",
        "Hay que reunir datos de diferentes archivos y elaborar informes manualmente.",
        "Es complicado conocer rápidamente los resultados y el estado de las operaciones."
      ] }
  ];

  /* Puntos de cada opción, en el mismo orden que las opciones (A, B, C, D) */
  var PUNTOS = [0, 1, 2, 3];

  /* ---------- Niveles de resultado (sobre 24 puntos) ---------- */
  var niveles = [
    { id: "conectados", min: 0, max: 5, titulo: "Procesos bastante conectados",
      descripcion: "Tu empresa parece contar con una operativa relativamente organizada. Todavía puede haber margen para simplificar tareas concretas, mejorar los avisos y conectar procesos." },
    { id: "simplificar", min: 6, max: 11, titulo: "Hay tareas que podrían simplificarse",
      descripcion: "Parte de la gestión está organizada, pero todavía pueden existir procesos que dependen de intervenciones manuales y de herramientas que no comparten toda la información." },
    { id: "manual", min: 12, max: 17, titulo: "El trabajo manual tiene un peso importante",
      descripcion: "Tus respuestas indican que distintas tareas pueden estar consumiendo tiempo administrativo y comercial. Hay oportunidades para centralizar información y automatizar pasos repetitivos." },
    { id: "alto", min: 18, max: 24, titulo: "Hay un alto potencial de automatización",
      descripcion: "Tus respuestas reflejan una importante presencia de tareas manuales y procesos desconectados. Conviene identificar qué flujo puede mejorarse primero y diseñar una solución que se adapte a la operativa de la empresa." }
  ];

  /* ---------- Recomendaciones: una por pregunta (mismo índice) ---------- */
  var recomendaciones = [
    { id: "entrada-pedidos", pregunta: 0, titulo: "Automatización de entrada de pedidos",
      texto: "Las solicitudes que llegan por correo, formularios o mensajes quedan registradas en un único lugar sin copiarlas a mano." },
    { id: "asignacion", pregunta: 1, titulo: "Registro y asignación automática",
      texto: "Cada nueva solicitud se clasifica y llega directamente a la persona que debe atenderla." },
    { id: "presupuestos", pregunta: 2, titulo: "Presupuestos a partir de datos centralizados",
      texto: "Las ofertas se preparan con la información de clientes y productos ya registrada, sin rehacer documentos." },
    { id: "dato-unico", pregunta: 3, titulo: "Un único registro para cada dato",
      texto: "La información se introduce una vez y se reutiliza en presupuestos, pedidos y documentación." },
    { id: "avisos", pregunta: 4, titulo: "Avisos y tareas de seguimiento automáticas",
      texto: "El sistema recuerda cuándo volver a contactar con un cliente para que ninguna oferta se quede sin respuesta." },
    { id: "panel-seguimiento", pregunta: 5, titulo: "Panel de seguimiento comercial",
      texto: "El estado de cada pedido, oferta o solicitud visible en un mismo lugar para todo el equipo." },
    { id: "integracion", pregunta: 6, titulo: "Integración de aplicaciones",
      texto: "Los programas que ya utilizáis comparten datos entre sí y se reduce el traslado manual de información." },
    { id: "panel-direccion", pregunta: 7, titulo: "Panel de control para dirección",
      texto: "Indicadores del negocio actualizados sin tener que reunir datos de varios archivos." }
  ];

  var recomendacionSinPrioridad = {
    id: "revision-periodica", pregunta: null, titulo: "Revisión periódica de procesos",
    texto: "Detectar a tiempo las tareas que vuelven a hacerse a mano cuando cambian los clientes, el equipo o las herramientas."
  };

  return {
    version: "1.0.0",
    LETRAS: LETRAS,
    PUNTOS: PUNTOS,
    MAX_TOTAL: preguntas.length * PUNTOS[PUNTOS.length - 1],
    sectores: sectores,
    tamanos: tamanos,
    dimensiones: dimensiones,
    preguntas: preguntas,
    niveles: niveles,
    recomendaciones: recomendaciones,
    oportunidadSinPrioridad: oportunidadSinPrioridad,
    recomendacionSinPrioridad: recomendacionSinPrioridad,
    MAX_RECOMENDACIONES: 3
  };
});
