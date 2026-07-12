import { makeId } from './id';

export const ROOM_TYPES = [
  'Living Room',
  'Bedroom',
  'Master Bedroom',
  'Children Room',
  'Mandir Area',
  'Dining Area',
  'Study Room',
  'Guest Room'
];

export const PAPERS = [
  'Non Woven',
  'Matt Lamination',
  'Premium Glitter',
  'Premium Stroke',
  'Canvas Paper',
  'Canvas Fabric',
  'Premium Non Woven',
  'PVC Paper',
  'HD Paper',
  'Leather Texture',
  'Ivory Weave',
  'Embossed Non Woven',
  'Jointless Non Woven'
];

export const GS_URL = 'https://script.google.com/macros/s/AKfycby3u-NRXPcTtcXFSUX3dNDi78ozwCuyK9vTDqmWklb65AJ3bTQO7wyNftu6LjW_HAPNxA/exec';

export const makeWall = () => ({
  id: makeId(),
  patternNum: '',
  width: 350,
  height: 120,
  rate: 0,
  items: []
});

export const makeRoom = () => ({
  id: makeId(),
  category: ROOM_TYPES[2],
  roomPaper: PAPERS[1],
  walls: [makeWall()]
});
