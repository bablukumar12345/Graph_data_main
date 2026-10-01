import { makeId } from './id';

export const ROOM_TYPES = [
  'Custom Room',
  'Living Room',
  'Bedroom',
  'Master Bedroom',
  'Children Room',
  'Main Room',
  'Mandir Area',
  'Dining Area',
  'Study Room',
  'Guest Room',
  'Stairs Area',
  'Lobby'
];

export const CUSTOM_ROOM = 'Custom Room';

export const roomName = (room) => (
  room?.category === CUSTOM_ROOM ? room.customName?.trim() || CUSTOM_ROOM : room?.category
);

export const PAPERS = [
  'Custom Paper Quality',
  'Non Woven',
  'Matt Lamination',
  'Premium Glitter',
  'Premium Stroke',
  'Canvas Paper',
  'Canvas Fabric',
  'Canvas Fabric (Jointless)',
  'Premium Non Woven',
  'PVC Paper',
  'HD Paper',
  'Leather Texture',
  'Ivory Weave',
  'Embossed Non Woven',
  'Non Woven (Jointless)'
];

export const CUSTOM_PAPER = 'Custom Paper Quality';

export const paperName = (room) => (
  room?.roomPaper === CUSTOM_PAPER ? room.customPaperName?.trim() || CUSTOM_PAPER : room?.roomPaper
);

export const WALLPAPER_PAPER = 'Wallpaper';

export const WALLPAPER_OPTIONS = ['None', WALLPAPER_PAPER];

export const GS_URL = 'https://script.google.com/macros/s/AKfycby3u-NRXPcTtcXFSUX3dNDi78ozwCuyK9vTDqmWklb65AJ3bTQO7wyNftu6LjW_HAPNxA/exec';

export const makeWall = () => ({
  id: makeId(),
  patternNum: '',
  width: 350,
  height: 120,
  rate: 0,
  items: [],
  rollCount: '',
  rollPrice: ''
});

export const makeRoom = () => ({
  id: makeId(),
  category: ROOM_TYPES[2],
  customName: '',
  roomPaper: PAPERS[1],
  customPaperName: '',
  wallpaperOption: 'None',
  walls: [makeWall()]
});
