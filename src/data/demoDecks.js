import { normalizeQuestion, parseQuestionsJson } from '../utils/deckUtils.js';
import gcpMasterRaw from './decks/master_quiz.json';
import gcpNetworkRaw from './decks/network_architecture.json';

const rawDecks = {
  gcp_master: {
    id: 'gcp_master',
    title: '🎯 Google Cloud ACE: Master Quiz',
    description: '85 preguntas oficiales: IAM, Jerarquía, VPC, GKE, Cloud Run, Spanner, Observabilidad y Terraform.',
    questions: parseQuestionsJson(gcpMasterRaw),
  },
  gcp_network: {
    id: 'gcp_network',
    title: '🌐 GCP: Network Architecture & VPCs',
    description: '13 preguntas: Subredes, Cloud NAT, Peering transitivo, NCC y Stateful Firewalls.',
    questions: parseQuestionsJson(gcpNetworkRaw),
  },
  aws: {
    id: 'aws',
    title: '☁️ AWS Cloud & DevOps Essentials',
    description: 'Conceptos clave de arquitectura en la nube, S3, IAM, EC2 y alta disponibilidad.',
    questions: [
      {
        id: 'aws-1',
        question: '¿Qué servicio de AWS proporciona almacenamiento de objetos altamente duradero y escalable?',
        options: {
          A: 'Amazon EC2',
          B: 'Amazon S3',
          C: 'Amazon EBS',
          D: 'Amazon EFS'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: 'Amazon Simple Storage Service (S3) es el servicio de almacenamiento de objetos líder de AWS con una durabilidad diseñada del 99.999999999% (11 nueves).'
      },
      {
        id: 'aws-2',
        question: '¿Cuál es el principio de seguridad recomendado por AWS para asignar permisos en IAM?',
        options: {
          A: 'Principio de Máxima Accesibilidad',
          B: 'Principio de Privilegio Mínimo (Least Privilege)',
          C: 'Permisos Abiertos por Defecto',
          D: 'Autenticación Única Global'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: 'El Principio de Privilegio Mínimo concede únicamente los permisos estrictamente indispensables para llevar a cabo una tarea.'
      },
      {
        id: 'aws-3',
        question: '¿Cuáles de los siguientes son beneficios clave de usar AWS CloudFront? (Selección múltiple)',
        options: {
          A: 'Reducción de latencia mediante Edge Locations globales',
          B: 'Reemplazo total de bases de datos relacionales',
          C: 'Protección integrada contra ataques DDoS con AWS Shield',
          D: 'Compilación de código fuente sin servidor'
        },
        answer_official: 'AC',
        answer_community: 'AC',
        explanation: 'CloudFront es la CDN de AWS que entrega contenido mediante una red mundial de Edge Locations y ofrece mitigación DDoS integrada con AWS Shield.'
      },
      {
        id: 'aws-4',
        question: '¿Qué servicio permite ejecutar código en respuesta a eventos sin necesidad de aprovisionar ni administrar servidores?',
        options: {
          A: 'AWS Lambda',
          B: 'Amazon RDS',
          C: 'AWS Elastic Beanstalk',
          D: 'Amazon Lightsail'
        },
        answer_official: 'A',
        answer_community: 'A',
        explanation: 'AWS Lambda es el servicio Serverless compute de AWS que ejecuta código en respuesta a eventos y escala automáticamente.'
      },
      {
        id: 'aws-5',
        question: '¿Qué mecanismo en Amazon VPC se utiliza para controlar el tráfico a nivel de subred (Stateless)?',
        options: {
          A: 'Security Groups',
          B: 'Network Access Control Lists (NACLs)',
          C: 'Internet Gateway',
          D: 'NAT Gateway'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: 'Las NACL operan a nivel de subred y son stateless (requieren reglas explícitas tanto de entrada como de salida).'
      },
      {
        id: 'aws-6',
        question: '¿Qué componente garantiza que las instancias EC2 distribuyan automáticamente el tráfico entrante de aplicaciones?',
        options: {
          A: 'AWS Auto Scaling',
          B: 'Elastic Load Balancing (ELB)',
          C: 'Amazon Route 53 Traffic Flow',
          D: 'AWS Direct Connect'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: 'Elastic Load Balancing distribuye el tráfico entrante entre múltiples destinos, tales como instancias EC2, contenedores y direcciones IP.'
      }
    ]
  },
  javascript: {
    id: 'javascript',
    title: '⚡ JavaScript & Web Moderno',
    description: 'Event Loop, Closures, Asincronía, Promesas y DOM.',
    questions: [
      {
        id: 'js-1',
        question: '¿Cuál es el orden de ejecución en el Event Loop de JavaScript para las siguientes tareas?',
        options: {
          A: 'MacroTask -> MicroTask -> Call Stack',
          B: 'Call Stack -> MicroTasks (Promesas) -> MacroTasks (setTimeout)',
          C: 'MacroTasks -> Call Stack -> Render Pipeline',
          D: 'MicroTasks -> Web APIs -> Worker Threads'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: 'El Call Stack se vacía primero, luego se procesa la cola de Microtasks (ej. `Promise.then`, `queueMicrotask`) y finalmente se atiende una Macrotask (ej. `setTimeout`).'
      },
      {
        id: 'js-2',
        question: '¿Qué estructura de datos garantiza claves únicas por referencia de objeto y permite recolección de basura (Garbage Collection)?',
        options: {
          A: 'Map',
          B: 'WeakMap',
          C: 'Set',
          D: 'Object.freeze'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: 'En WeakMap las claves deben ser objetos y se mantienen en referencias débiles, lo que permite que el recolector de basura las libere si no hay otras referencias.'
      },
      {
        id: 'js-3',
        question: '¿Qué método previene la propagación de un evento hacia los ancestros en el árbol DOM?',
        options: {
          A: 'event.preventDefault()',
          B: 'event.stopPropagation()',
          C: 'event.stopImmediatePropagation()',
          D: 'event.cancelBubble = false'
        },
        answer_official: 'B',
        answer_community: 'B',
        explanation: '`event.stopPropagation()` detiene la fase de burbujeo (bubbling) o captura del evento hacia los elementos contenedores.'
      },
      {
        id: 'js-4',
        question: '¿Cuáles de las siguientes afirmaciones sobre Closures en JavaScript son verdaderas? (Selección múltiple)',
        options: {
          A: 'Permiten a una función interna recordar el ámbito léxico donde fue creada',
          B: 'Solo funcionan cuando se utiliza la palabra clave `var`',
          C: 'Son fundamentales para encapsulación y funciones de fábrica (factories)',
          D: 'Destruyen automáticamente las variables del scope exterior'
        },
        answer_official: 'AC',
        answer_community: 'AC',
        explanation: 'Un closure es la combinación de una función agrupada con referencias a su estado circundante (ámbito léxico), permitiendo patrones de encapsulación.'
      }
    ]
  }
};

// Exportar mazos con preguntas normalizadas
export const DEMO_DECKS = Object.fromEntries(
  Object.entries(rawDecks).map(([key, deck]) => [
    key,
    {
      ...deck,
      questions: deck.questions.map((q, idx) => normalizeQuestion(q, idx)),
    },
  ])
);
