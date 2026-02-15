const { Factions } = require("./client/src/const");
const { effects } = require("./game/effects");
const { CellType } = require("./game/cell");

/**
 * @import { Position, Cell } from "./game/types";
 * @import { EffectDefinition } from "./game/effectTypes";
 * @import { GameState } from "./game/state";
 */

const mapObjects = {
  '牆': { block: true, effects: [effects.HIT_WALL] },
  '柵': { block: true, effects: [effects.HIT_WALL] },
  '柱': { block: true, effects: [effects.HIT_WALL] },
  '門': { block: true },
  '桌': { block: true, effects: [effects.TAKE_POT, effects.PUT_POT] },
  '椅': { block: false, effects: [effects.CHAIR]},
  '几': { block: true, effects: [effects.TAKE_POT, effects.PUT_POT] },
  '日記': { block: true, effects: [effects.DIARY] },
  '冰箱': { block: true, effects: [effects.FRIDGE] },
  '月曆': { block: true, effects: [effects.READ_CALENDAR] },
  '衣櫃': { block: true },
  '床': { block: false, effects: [effects.BED_SLEEP] },
  '櫃': { block: true },
  '電話': { block: true, effects: [effects.PHONE_CALL] },
  '槽': { block: true, effects: [effects.WASH_HAND, effects.FILL_POT] },
  '馬桶': { block: false, effects: [effects.TOILET] },
  '浴缸': { block: false, effects: [effects.BATHTUB] },
  '桶': { block: true, effects: [effects.TRACH_CAN] },
  '台': { block: true, effects: [effects.TAKE_POT, effects.PUT_POT] },
  '爐': { block: true, effects: [effects.TAKE_POT, effects.PUT_POT] },
  '書': { block: true },
  '鞋': { block: false, effects: [effects.WEAR_SHOES] },
  '花': { block: true },
  '樹': { block: true },
  '人': { block: true },
  '蟲': { block: true },
  '劍': { block: true, effects: [effects.SWORD] },
  '金': { block: false, effects: [effects.GOLD] },
  '銀': { block: false, effects: [effects.SILVER] },
  '按鈕': { block: true, effects: [effects.BUTTON] },
};

module.exports = {
  getMainMap,
  isCellBlocking,
  setCellBlocking,
  CellType,
};

/**
 * @param {CellType} cellType
 * @param {boolean} blocking
 */
function setCellBlocking(cellType, blocking) {
  if (mapObjects[cellType]) {
    mapObjects[cellType].block = blocking;
  }
}

/**
 * @param {Cell}
 * @returns {boolean}
 */
function isCellBlocking(cell) {
  if ('block' in cell) {
    return cell.block;
  }
  return mapObjects[cell.t]?.block;
}

/**
 * @param {Cell[][]} cells
 * @param {CellType | (Cell) => boolean} condition
 * @returns {Omit<Position, 'mapId'>}
 */
function findCell(cells, condition) {
  if (typeof condition === 'string') {
    condition = (cell) => cell.t === condition;
  }
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (condition?.(cells[r][c])) {
        return { row: r, col: c, cell: cells[r][c] };
      }
    }
  }
  return null;
}

/**
 * @returns {GameMap}
 */
function getMainMap() {
  const cells = getCells();
  const table = findCell(cells, (cell) => cell.t === CellType.TEA_TABLE);
  const fridge = findCell(cells, (cell) => cell.t === CellType.FRIDGE);
  const diary = findCell(cells, (cell) => cell.t === CellType.DIARY);
  return {
    mapId: 'main',
    width: 28,
    height: 29,
    cells,
    getTable: () => table,
    getFridge: () => fridge,
  };
}


/**
 * @param {CellType} cellType
 * @returns {Cell}
 */
function makeCell(cellType) {
  const baseObject = { ...mapObjects[cellType], t: cellType } ?? { t: cellType };
  switch(cellType) {
    case '門':
      return {
        ...baseObject,
        blockFn: (/** @type {GameState} */state) => {
          const hasShoes = state.items.includes('鞋子');
          if (!hasShoes) {
            state.messages.push('出門要穿鞋子！');
          }
          return !hasShoes;
        },
      };
    default:
      return baseObject;
  }
}

/**
 * @returns {Cell[][]}
 */
function getCells() {
  const cells = Array.from({ length: 40 }, () =>
    Array.from({ length: 40 }, () => ({}))
  );

  {
    // cells[20][20] = makeCell("START");
    // cells[6][13] = makeCell("冰箱");
    // cells[21][21] = makeCell("冰箱");
    // cells[17][23] = makeCell("日記");
    // cells[20][9] = makeCell("几");
    // cells[17][22] = makeCell("桌");
    // cells[17][24] = makeCell("桌");

    cells[0][0] = makeCell("牆");
    cells[0][1] = makeCell("牆");
    cells[0][2] = makeCell("牆");
    cells[0][3] = makeCell("牆");
    cells[0][4] = makeCell("牆");
    cells[0][5] = makeCell("牆");
    cells[0][6] = makeCell("牆");
    cells[0][7] = makeCell("牆");
    cells[0][8] = makeCell("牆");
    cells[0][9] = makeCell("牆");
    cells[0][10] = makeCell("牆");
    cells[0][11] = makeCell("牆");
    cells[0][13] = makeCell("人");
    cells[0][15] = makeCell("牆");
    cells[0][16] = makeCell("牆");
    cells[0][17] = makeCell("牆");
    cells[0][18] = makeCell("牆");
    cells[0][19] = makeCell("牆");
    cells[0][20] = makeCell("柵");
    cells[0][21] = makeCell("柵");
    cells[0][22] = makeCell("柵");
    cells[0][23] = makeCell("柵");
    cells[0][24] = makeCell("柵");
    cells[0][25] = makeCell("柵");
    cells[0][26] = makeCell("柵");
    cells[0][27] = makeCell("柵");
    cells[1][0] = makeCell("牆");
    cells[1][1] = makeCell("花");
    cells[1][3] = makeCell("爐");
    cells[1][4] = makeCell("爐");
    cells[1][6] = makeCell("花");
    cells[1][7] = makeCell("牆");
    cells[1][9] = makeCell("花");
    cells[1][11] = makeCell("牆");
    cells[1][12] = makeCell("牆");
    cells[1][13] = makeCell("門");
    cells[1][14] = makeCell("牆");
    cells[1][15] = makeCell("牆");
    cells[1][17] = makeCell("花");
    cells[1][19] = makeCell("牆");
    cells[1][20] = makeCell("花");
    cells[1][24] = makeCell("花");
    cells[1][25] = makeCell("花");
    cells[1][26] = makeCell("花");
    cells[1][27] = makeCell("柵");
    cells[2][0] = makeCell("牆");
    cells[2][7] = makeCell("牆");
    cells[2][19] = makeCell("牆");
    cells[2][23] = makeCell("劍");
    cells[2][26] = makeCell("花");
    cells[2][27] = makeCell("柵");
    cells[3][0] = makeCell("牆");
    cells[3][11] = makeCell("柱");
    cells[3][15] = makeCell("柱");
    cells[3][19] = makeCell("門");
    cells[3][21] = makeCell("劍");
    cells[3][25] = makeCell("樹");
    cells[3][26] = makeCell("花");
    cells[3][27] = makeCell("柵");
    cells[4][0] = makeCell("牆");
    cells[4][2] = makeCell("椅");
    cells[4][3] = makeCell("几");
    cells[4][4] = makeCell("几");
    cells[4][5] = makeCell("椅");
    cells[4][19] = makeCell("牆");
    cells[4][26] = makeCell("花");
    cells[4][27] = makeCell("柵");
    cells[5][0] = makeCell("牆");
    cells[5][3] = makeCell("椅");
    cells[5][4] = makeCell("椅");
    cells[5][7] = makeCell("牆");
    cells[5][10] = makeCell("牆");
    cells[5][11] = makeCell("牆");
    cells[5][12] = makeCell("牆");
    cells[5][13] = makeCell("牆");
    cells[5][14] = makeCell("牆");
    cells[5][15] = makeCell("牆");
    cells[5][16] = makeCell("牆");
    cells[5][19] = makeCell("牆");
    cells[5][20] = makeCell("花");
    cells[5][23] = makeCell("劍");
    cells[5][26] = makeCell("花");
    cells[5][27] = makeCell("柵");
    cells[6][0] = makeCell("牆");
    cells[6][7] = makeCell("牆");
    cells[6][10] = makeCell("牆");
    cells[6][11] = makeCell("櫃");
    cells[6][12] = makeCell("櫃");
    cells[6][13] = makeCell("櫃");
    cells[6][14] = makeCell("櫃");
    cells[6][15] = makeCell("櫃");
    cells[6][16] = makeCell("牆");
    cells[6][19] = makeCell("牆");
    cells[6][24] = makeCell("花");
    cells[6][25] = makeCell("花");
    cells[6][26] = makeCell("花");
    cells[6][27] = makeCell("柵");
    cells[7][0] = makeCell("牆");
    cells[7][1] = makeCell("花");
    cells[7][6] = makeCell("花");
    cells[7][7] = makeCell("牆");
    cells[7][10] = makeCell("牆");
    cells[7][16] = makeCell("牆");
    cells[7][19] = makeCell("牆");
    cells[7][20] = makeCell("櫃");
    cells[7][21] = makeCell("櫃");
    cells[7][22] = makeCell("櫃");
    cells[7][23] = makeCell("櫃");
    cells[7][24] = makeCell("櫃");
    cells[7][25] = makeCell("櫃");
    cells[7][26] = makeCell("櫃");
    cells[7][27] = makeCell("牆");
    cells[8][0] = makeCell("牆");
    cells[8][1] = makeCell("牆");
    cells[8][2] = makeCell("牆");
    cells[8][3] = makeCell("牆");
    cells[8][4] = makeCell("牆");
    cells[8][6] = makeCell("牆");
    cells[8][7] = makeCell("牆");
    cells[8][10] = makeCell("牆");
    cells[8][12] = makeCell("椅");
    cells[8][13] = makeCell("几");
    cells[8][14] = makeCell("椅");
    cells[8][16] = makeCell("牆");
    cells[8][19] = makeCell("牆");
    cells[8][20] = makeCell("櫃");
    cells[8][26] = makeCell("櫃");
    cells[8][27] = makeCell("牆");
    cells[9][0] = makeCell("牆");
    cells[9][7] = makeCell("牆");
    cells[9][10] = makeCell("門");
    cells[9][16] = makeCell("門");
    cells[9][19] = makeCell("門");
    cells[9][22] = makeCell("櫃");
    cells[9][23] = makeCell("櫃");
    cells[9][24] = makeCell("櫃");
    cells[9][26] = makeCell("櫃");
    cells[9][27] = makeCell("牆");
    cells[10][0] = makeCell("牆");
    cells[10][3] = makeCell("椅");
    cells[10][10] = makeCell("牆");
    cells[10][15] = makeCell("桌");
    cells[10][16] = makeCell("牆");
    cells[10][19] = makeCell("牆");
    cells[10][20] = makeCell("櫃");
    cells[10][22] = makeCell("櫃");
    cells[10][23] = makeCell("書");
    cells[10][24] = makeCell("櫃");
    cells[10][27] = makeCell("牆");
    cells[11][0] = makeCell("牆");
    cells[11][2] = makeCell("椅");
    cells[11][3] = makeCell("桌");
    cells[11][4] = makeCell("椅");
    cells[11][7] = makeCell("牆");
    cells[11][8] = makeCell("花");
    cells[11][10] = makeCell("牆");
    cells[11][11] = makeCell("電話");
    cells[11][14] = makeCell("椅");
    cells[11][15] = makeCell("桌");
    cells[11][16] = makeCell("牆");
    cells[11][19] = makeCell("牆");
    cells[11][20] = makeCell("櫃");
    cells[11][22] = makeCell("櫃");
    cells[11][24] = makeCell("櫃");
    cells[11][25] = makeCell("書");
    cells[11][27] = makeCell("牆");
    cells[12][0] = makeCell("牆");
    cells[12][3] = makeCell("桌");
    cells[12][7] = makeCell("牆");
    cells[12][10] = makeCell("牆");
    cells[12][11] = makeCell("牆");
    cells[12][12] = makeCell("牆");
    cells[12][13] = makeCell("門");
    cells[12][14] = makeCell("牆");
    cells[12][15] = makeCell("牆");
    cells[12][16] = makeCell("牆");
    cells[12][18] = makeCell("花");
    cells[12][19] = makeCell("牆");
    cells[12][20] = makeCell("櫃");
    cells[12][22] = makeCell("櫃");
    cells[12][23] = makeCell("書");
    cells[12][24] = makeCell("櫃");
    cells[12][25] = makeCell("書");
    cells[12][27] = makeCell("牆");
    cells[13][0] = makeCell("牆");
    cells[13][2] = makeCell("椅");
    cells[13][3] = makeCell("桌");
    cells[13][4] = makeCell("椅");
    cells[13][6] = makeCell("爐");
    cells[13][7] = makeCell("牆");
    cells[13][10] = makeCell("牆");
    cells[13][11] = makeCell("桌");
    cells[13][12] = makeCell("日記");
    cells[13][15] = makeCell("月曆");
    cells[13][16] = makeCell("牆");
    cells[13][19] = makeCell("牆");
    cells[13][20] = makeCell("櫃");
    cells[13][22] = makeCell("櫃");
    cells[13][23] = makeCell("書");
    cells[13][27] = makeCell("牆");
    cells[14][0] = makeCell("牆");
    cells[14][3] = makeCell("桌");
    cells[14][7] = makeCell("牆");
    cells[14][10] = makeCell("牆");
    cells[14][12] = makeCell("椅");
    cells[14][16] = makeCell("牆");
    cells[14][19] = makeCell("牆");
    cells[14][20] = makeCell("櫃");
    cells[14][22] = makeCell("櫃");
    cells[14][23] = makeCell("桌");
    cells[14][24] = makeCell("椅");
    cells[14][26] = makeCell("書");
    cells[14][27] = makeCell("牆");
    cells[15][0] = makeCell("牆");
    cells[15][2] = makeCell("椅");
    cells[15][3] = makeCell("桌");
    cells[15][4] = makeCell("椅");
    cells[15][7] = makeCell("牆");
    cells[15][8] = makeCell("花");
    cells[15][10] = makeCell("門");
    cells[15][13] = makeCell("鞋");
    cells[15][16] = makeCell("門");
    cells[15][19] = makeCell("牆");
    cells[15][20] = makeCell("櫃");
    cells[15][22] = makeCell("櫃");
    cells[15][23] = makeCell("書");
    cells[15][26] = makeCell("櫃");
    cells[15][27] = makeCell("牆");
    cells[16][0] = makeCell("牆");
    cells[16][3] = makeCell("椅");
    cells[16][10] = makeCell("牆");
    cells[16][16] = makeCell("牆");
    cells[16][19] = makeCell("牆");
    cells[16][20] = makeCell("櫃");
    cells[16][22] = makeCell("櫃");
    cells[16][23] = makeCell("書");
    cells[16][24] = makeCell("書");
    cells[16][26] = makeCell("櫃");
    cells[16][27] = makeCell("牆");
    cells[17][0] = makeCell("牆");
    cells[17][7] = makeCell("牆");
    cells[17][10] = makeCell("牆");
    cells[17][11] = makeCell("衣櫃");
    cells[17][12] = makeCell("衣櫃");
    cells[17][14] = makeCell("床");
    cells[17][15] = makeCell("櫃");
    cells[17][16] = makeCell("牆");
    cells[17][19] = makeCell("牆");
    cells[17][20] = makeCell("櫃");
    cells[17][22] = makeCell("櫃");
    cells[17][23] = makeCell("書");
    cells[17][26] = makeCell("櫃");
    cells[17][27] = makeCell("牆");
    cells[18][0] = makeCell("牆");
    cells[18][1] = makeCell("牆");
    cells[18][2] = makeCell("牆");
    cells[18][3] = makeCell("牆");
    cells[18][4] = makeCell("牆");
    cells[18][6] = makeCell("牆");
    cells[18][7] = makeCell("牆");
    cells[18][10] = makeCell("牆");
    cells[18][11] = makeCell("牆");
    cells[18][12] = makeCell("牆");
    cells[18][13] = makeCell("門");
    cells[18][14] = makeCell("牆");
    cells[18][15] = makeCell("牆");
    cells[18][16] = makeCell("牆");
    cells[18][19] = makeCell("牆");
    cells[18][20] = makeCell("櫃");
    cells[18][26] = makeCell("櫃");
    cells[18][27] = makeCell("牆");
    cells[19][0] = makeCell("牆");
    cells[19][1] = makeCell("爐");
    cells[19][2] = makeCell("爐");
    cells[19][3] = makeCell("台");
    cells[19][4] = makeCell("槽");
    cells[19][6] = makeCell("櫃");
    cells[19][7] = makeCell("牆");
    cells[19][18] = makeCell("花");
    cells[19][19] = makeCell("牆");
    cells[19][20] = makeCell("櫃");
    cells[19][21] = makeCell("櫃");
    cells[19][22] = makeCell("櫃");
    cells[19][23] = makeCell("櫃");
    cells[19][24] = makeCell("櫃");
    cells[19][25] = makeCell("櫃");
    cells[19][26] = makeCell("櫃");
    cells[19][27] = makeCell("牆");
    cells[20][0] = makeCell("牆");
    cells[20][7] = makeCell("牆");
    cells[20][10] = makeCell("牆");
    cells[20][11] = makeCell("牆");
    cells[20][12] = makeCell("牆");
    cells[20][13] = makeCell("門");
    cells[20][14] = makeCell("牆");
    cells[20][15] = makeCell("牆");
    cells[20][16] = makeCell("牆");
    cells[20][17] = makeCell("門");
    cells[20][18] = makeCell("牆");
    cells[20][19] = makeCell("牆");
    cells[20][20] = makeCell("牆");
    cells[20][21] = makeCell("牆");
    cells[20][22] = makeCell("牆");
    cells[20][23] = makeCell("牆");
    cells[20][24] = makeCell("牆");
    cells[20][25] = makeCell("牆");
    cells[20][26] = makeCell("牆");
    cells[20][27] = makeCell("牆");
    cells[21][0] = makeCell("牆");
    cells[21][3] = makeCell("台");
    cells[21][4] = makeCell("台");
    cells[21][5] = makeCell("台");
    cells[21][10] = makeCell("牆");
    cells[21][11] = makeCell("槽");
    cells[21][12] = makeCell("槽");
    cells[21][14] = makeCell("花");
    cells[21][15] = makeCell("牆");
    cells[21][16] = makeCell("牆");
    cells[21][18] = makeCell("牆");
    cells[21][19] = makeCell("按鈕");
    cells[21][20] = makeCell("銀");
    cells[21][21] = makeCell("牆");
    cells[21][22] = makeCell("牆");
    cells[21][23] = makeCell("牆");
    cells[21][24] = makeCell("牆");
    cells[21][25] = makeCell("牆");
    cells[21][26] = makeCell("牆");
    cells[21][27] = makeCell("牆");
    cells[22][0] = makeCell("牆");
    cells[22][7] = makeCell("牆");
    cells[22][10] = makeCell("牆");
    cells[22][15] = makeCell("牆");
    cells[22][16] = makeCell("牆");
    cells[22][18] = makeCell("牆");
    cells[22][19] = makeCell("牆");
    cells[22][26] = makeCell("金");
    cells[22][27] = makeCell("牆");
    cells[23][0] = makeCell("牆");
    cells[23][1] = makeCell("冰箱");
    cells[23][2] = makeCell("櫃");
    cells[23][3] = makeCell("櫃");
    cells[23][4] = makeCell("櫃");
    cells[23][6] = makeCell("桶");
    cells[23][7] = makeCell("牆");
    cells[23][10] = makeCell("牆");
    cells[23][11] = makeCell("門");
    cells[23][12] = makeCell("牆");
    cells[23][13] = makeCell("門");
    cells[23][14] = makeCell("牆");
    cells[23][15] = makeCell("牆");
    cells[23][16] = makeCell("牆");
    cells[23][18] = makeCell("牆");
    cells[23][19] = makeCell("牆");
    cells[23][20] = makeCell("牆");
    cells[23][21] = makeCell("牆");
    cells[23][23] = makeCell("牆");
    cells[23][24] = makeCell("牆");
    cells[23][25] = makeCell("牆");
    cells[23][26] = makeCell("牆");
    cells[23][27] = makeCell("牆");
    cells[24][0] = makeCell("牆");
    cells[24][1] = makeCell("牆");
    cells[24][2] = makeCell("牆");
    cells[24][3] = makeCell("牆");
    cells[24][4] = makeCell("牆");
    cells[24][5] = makeCell("牆");
    cells[24][6] = makeCell("牆");
    cells[24][7] = makeCell("牆");
    cells[24][8] = makeCell("門");
    cells[24][9] = makeCell("牆");
    cells[24][10] = makeCell("牆");
    cells[24][12] = makeCell("牆");
    cells[24][15] = makeCell("牆");
    cells[24][16] = makeCell("牆");
    cells[24][23] = makeCell("牆");
    cells[24][24] = makeCell("牆");
    cells[24][25] = makeCell("牆");
    cells[24][26] = makeCell("牆");
    cells[24][27] = makeCell("牆");
    cells[25][0] = makeCell("柵");
    cells[25][1] = makeCell("花");
    cells[25][2] = makeCell("花");
    cells[25][3] = makeCell("花");
    cells[25][4] = makeCell("花");
    cells[25][5] = makeCell("花");
    cells[25][6] = makeCell("花");
    cells[25][7] = makeCell("花");
    cells[25][10] = makeCell("牆");
    cells[25][11] = makeCell("馬桶");
    cells[25][12] = makeCell("牆");
    cells[25][14] = makeCell("浴缸");
    cells[25][15] = makeCell("牆");
    cells[25][16] = makeCell("牆");
    cells[25][17] = makeCell("牆");
    cells[25][18] = makeCell("牆");
    cells[25][19] = makeCell("牆");
    cells[25][20] = makeCell("牆");
    cells[25][21] = makeCell("牆");
    cells[25][22] = makeCell("牆");
    cells[25][23] = makeCell("牆");
    cells[25][24] = makeCell("牆");
    cells[25][25] = makeCell("桶");
    cells[25][26] = makeCell("桶");
    cells[25][27] = makeCell("柵");
    cells[26][0] = makeCell("柵");
    cells[26][2] = makeCell("樹");
    cells[26][3] = makeCell("人");
    cells[26][4] = makeCell("花");
    cells[26][7] = makeCell("樹");
    cells[26][10] = makeCell("牆");
    cells[26][11] = makeCell("牆");
    cells[26][12] = makeCell("牆");
    cells[26][13] = makeCell("牆");
    cells[26][14] = makeCell("牆");
    cells[26][15] = makeCell("牆");
    cells[26][16] = makeCell("牆");
    cells[26][17] = makeCell("牆");
    cells[26][18] = makeCell("牆");
    cells[26][19] = makeCell("牆");
    cells[26][20] = makeCell("牆");
    cells[26][21] = makeCell("牆");
    cells[26][22] = makeCell("牆");
    cells[26][23] = makeCell("牆");
    cells[26][24] = makeCell("牆");
    cells[26][25] = makeCell("人");
    cells[26][27] = makeCell("柵");
    cells[27][0] = makeCell("柵");
    cells[27][1] = makeCell("花");
    cells[27][2] = makeCell("花");
    cells[27][3] = makeCell("花");
    cells[27][4] = makeCell("花");
    cells[27][5] = makeCell("花");
    cells[27][6] = makeCell("花");
    cells[27][7] = makeCell("花");
    cells[27][13] = makeCell("花");
    cells[27][21] = makeCell("花");
    cells[27][24] = makeCell("門");
    cells[27][27] = makeCell("柵");
    cells[28][0] = makeCell("柵");
    cells[28][1] = makeCell("柵");
    cells[28][2] = makeCell("柵");
    cells[28][3] = makeCell("柵");
    cells[28][4] = makeCell("柵");
    cells[28][5] = makeCell("柵");
    cells[28][6] = makeCell("柵");
    cells[28][7] = makeCell("柵");
    cells[28][11] = makeCell("樹");
    cells[28][17] = makeCell("樹");
    cells[28][19] = makeCell("樹");
    cells[28][24] = makeCell("柵");
    cells[28][25] = makeCell("柵");
    cells[28][26] = makeCell("柵");
    cells[28][27] = makeCell("柵");
  }

  cells[16][10].effects = [effects.makePublicScoreEffect('+10', Factions.RED)];
  cells[16][11].effects = [effects.makePublicScoreEffect('-2', Factions.BLUE)];
  cells[16][12].effects = [effects.makePublicScoreEffect('*2', Factions.YELLOW)];
  cells[16][13].effects = [effects.makePublicScoreEffect('/2', Factions.GREEN)];
  cells[16][14].effects = [effects.makePublicScoreEffect('+1', Factions.RED), effects.makePublicScoreEffect('-1', Factions.BLUE)];

  return cells;
}
