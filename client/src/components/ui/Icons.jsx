import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faBullseye,
  faBasketShopping,
  faBell,
  faBox,
  faBus,
  faChartPie,
  faCheck,
  faCircleExclamation,
  faCirclePlus,
  faCloudArrowUp,
  faCoins,
  faEllipsis,
  faEnvelope,
  faEye,
  faEyeSlash,
  faHandshake,
  faHouse,
  faMagnifyingGlass,
  faMobileScreenButton,
  faMugHot,
  faLock,
  faPen,
  faPlus,
  faPiggyBank,
  faReceipt,
  faSmoking,
  faTrash,
  faUtensils,
  faUser,
  faWallet,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

const categoryIcons = [
  [/rokok|cigarette|smok/, faSmoking],
  [/makan|food|restoran/, faUtensils],
  [/kost|rumah|sewa|hunian/, faHouse],
  [/transport|kendaraan|bensin|ojek/, faBus],
  [/pulsa|internet|paket data|telepon/, faMobileScreenButton],
  [/nongkrong|kopi|hiburan|hangout/, faMugHot],
];

export function AppIcon({ name = 'wallet', className = '', size = '1em', animation, ...props }) {
  const icons = {
    arrowDown: faArrowDown,
    arrowLeft: faArrowLeft,
    arrowRight: faArrowRight,
    arrowUp: faArrowUp,
    bell: faBell,
    basket: faBasketShopping,
    goal: faBullseye,
    box: faBox,
    bus: faBus,
    chart: faChartPie,
    budget: faCirclePlus,
    check: faCheck,
    warning: faCircleExclamation,
    coins: faCoins,
    more: faEllipsis,
    envelope: faEnvelope,
    eye: faEye,
    eyeSlash: faEyeSlash,
    lock: faLock,
    handshake: faHandshake,
    house: faHouse,
    search: faMagnifyingGlass,
    mobile: faMobileScreenButton,
    coffee: faMugHot,
    edit: faPen,
    plus: faPlus,
    savings: faPiggyBank,
    cloud: faCloudArrowUp,
    receipt: faReceipt,
    user: faUser,
    trash: faTrash,
    utensils: faUtensils,
    wallet: faWallet,
    close: faXmark,
  };

  const classes = [className, animation && `fa-animation-${animation}`].filter(Boolean).join(' ');
  return <FontAwesomeIcon icon={icons[name] || faWallet} className={classes} style={{ width: size, height: size }} aria-hidden="true" {...props} />;
}

export function KostkasMark({ className = '', alt = '' }) {
  return <img src="/kostkas-logo.svg" className={className} alt={alt} />;
}

export function UserAvatar({ user, className = '' }) {
  const initial = (user?.name?.trim()[0] || 'T').toUpperCase();
  return <span className={className} aria-hidden="true">
    {user?.avatar ? <img src={user.avatar} alt="" /> : initial}
  </span>;
}

export function CategoryIcon({ category, className = '' }) {
  const name = typeof category === 'string' ? category : category?.name;
  const match = categoryIcons.find(([pattern]) => pattern.test(name || ''));
  return <FontAwesomeIcon icon={match?.[1] || faBox} className={className} aria-hidden="true" />;
}
