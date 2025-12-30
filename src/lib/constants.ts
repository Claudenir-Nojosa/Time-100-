import client1 from '../../public/client1.png';
import client2 from '../../public/client2.png';
import client3 from '../../public/client3.png';
import client4 from '../../public/client4.png';
import client5 from '../../public/client5.png';

export const CLIENTS = [
  { alt: 'client1', logo: client1 },
  { alt: 'client2', logo: client2 },
  { alt: 'client3', logo: client3 },
  { alt: 'client4', logo: client4 },
  { alt: 'client5', logo: client5 },
];

export const USERS = [
  {
    name: 'Alice',
    message:
      'Cypress has been a game-changer for our team. With its reliable end-to-end testing, we catch bugs early, leading to faster development cycles and improved collaboration.',
  },
  {
    name: 'Bob',
    message:
      "I used to spend hours debugging frontend issues, but Cypress simplified everything. Now, I'm more productive, and my colleagues can trust our code thanks to Cypress.",
  },
  {
    name: 'Charlie',
    message:
      "Cypress has transformed the way we work. Our QA and development teams are on the same page, and our productivity has skyrocketed. It's a must-have tool.",
  },
  {
    name: 'David',
    message:
      'I was skeptical at first, but Cypress exceeded my expectations. Our project timelines have improved, and collaboration between teams is seamless.',
  },
  {
    name: 'Ella',
    message:
      "Cypress made writing and running tests a breeze. Our team's productivity has never been higher, and we're delivering more reliable software.",
  },
  {
    name: 'Frank',
    message:
      "Thanks to Cypress, we've eliminated testing bottlenecks. Our developers and testers collaborate effortlessly, resulting in quicker releases.",
  },
  {
    name: 'Grace',
    message:
      'Cypress has improved our development process significantly. We now have more time for innovation, and our products are of higher quality.',
  },
  {
    name: 'Hank',
    message:
      "Cypress's user-friendly interface made it easy for our non-technical team members to contribute to testing. Our workflow is much more efficient now.",
  },
  {
    name: 'Ivy',
    message:
      "Our team's collaboration improved immensely with Cypress. We catch issues early, leading to less friction and quicker feature deployments.",
  },
  {
    name: 'Jack',
    message:
      "Cypress's robust testing capabilities have elevated our development standards. We work more harmoniously, and our releases are more reliable.",
  },
  {
    name: 'Katherine',
    message:
      "Cypress is a lifesaver for our cross-functional teams. We're more productive, and there's a shared sense of responsibility for product quality.",
  },
  {
    name: 'Liam',
    message:
      "Cypress has helped us maintain high standards of quality. Our team's collaboration has improved, resulting in faster development cycles.",
  },
  {
    name: 'Mia',
    message:
      "Cypress is a powerful tool that improved our productivity and collaboration. It's now an integral part of our development process.",
  },
  {
    name: 'Nathan',
    message:
      "Cypress's user-friendly interface and detailed reporting have made testing a breeze. Our team's productivity is at an all-time high.",
  },
  {
    name: 'Olivia',
    message:
      "We saw immediate benefits in terms of productivity and collaboration after adopting Cypress. It's an essential tool for our development workflow.",
  },
  {
    name: 'Paul',
    message:
      "Cypress has streamlined our testing process and brought our teams closer. We're more efficient and deliver better results.",
  },
  {
    name: 'Quinn',
    message:
      'Cypress has been a game-changer for us. Our productivity and collaboration have improved significantly, leading to better software.',
  },
  {
    name: 'Rachel',
    message:
      'Thanks to Cypress, our testing process is now a seamless part of our development cycle. Our teams collaborate effortlessly.',
  },
  {
    name: 'Sam',
    message:
      'Cypress is a fantastic tool that has revolutionized our workflow. Our productivity and collaboration have reached new heights.',
  },
];

export const PRICING_CARDS = [
  {
    planType: 'Free Plan',
    price: '0',
    description: 'Limited block trials  for teams',
    highlightFeature: '',
    freatures: [
      'Unlimited blocks for teams',
      'Unlimited file uploads',
      '30 day page history',
      'Invite 2 guests',
    ],
  },
  {
    planType: 'Pro Plan',
    price: '12.99',
    description: 'Billed annually. $17 billed monthly',
    highlightFeature: 'Everything in free +',
    freatures: [
      'Unlimited blocks for teams',
      'Unlimited file uploads',
      '1 year day page history',
      'Invite 10 guests',
    ],
  },
];

export const PRICING_PLANS = { proplan: 'Pro Plan', freeplan: 'Free Plan' };

export const MAX_FOLDERS_FREE_PLAN = 3;

export const CATEGORIAS_export = {
  apuracao: {
    label: "Apuração",
    cor: "bg-blue-100 text-blue-800 border-blue-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-blue-500",
    corExcel: "DBEAFE",
  },
  reuniao: {
    label: "Reunião",
    cor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-cyan-500",
    corExcel: "E0F2FE",
  },
  diagnostico: {
    label: "Diagnóstico",
    cor: "bg-orange-100 text-orange-800 border-orange-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-orange-500",
    corExcel: "FEF3C7",
  },
  outros: {
    label: "Outros",
    cor: "bg-gray-100 text-gray-800 border-gray-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-gray-200",
    corExcel: "F3F4F6",
  },
  script: {
    label: "Script",
    cor: "bg-green-100 text-green-800 border-green-200",
    corConcluida: "bg-green-100 text-green-800 border-green-200",
    corEscura: "bg-green-500",
    corExcel: "D1FAE5",
  },
} as const;

export const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];