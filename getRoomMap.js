const { removeFromArray, transferItem } = require("./array");
const { Factions } = require("./client/src/const");
const { gameItems } = require("./gameItems");

const mapObjects = {
  '牆': { block: true },
  '桌': { block: true },
  '几': { block: true },
  '日記': { block: true },
  '冰箱': { block: true },
};

module.exports = {
  getRoomMap,
  mapObjects,
};

function findCell(cells, cond) {
  for (let r = 0; r < cells.length; r++) {
    for (let c = 0; c < cells[r].length; c++) {
      if (cond(cells[r][c])) {
        return { row: r, col: c, cell: cells[r][c] };
      }
    }
  }
  return null;
}

function getEffects(cell) {
  const effects = {};
  switch (cell.t) {
    case '日記':
      effects.global = ['看日記'];
      break;
    case '冰箱':
      if (cell.items?.includes(gameItems.CAKE)) {
        effects.global = ['拿蛋糕'];
      }
      break;
    case '几':
      if (state.items?.includes(gameItems.CAKE)) {
        effects.global = ['放蛋糕'];
      }
      break;
    case '牆':
      effects.global = ['撞牆'];
      break;
  }
  return effects;
}

function defineCellEffects() {
  /** @typedef {string} RoomEnum */
  /** @typedef {string} GameItem */
  /** @typedef {string} PlayerFaction */
  /** @typedef {string} PlayerItem */
  /** @typedef {string} PlayerID */
  /** @typedef {Record<string, any>} Cell */
  /** @typedef {string} CellType */
  /**
   * @typedef {{
   *   map: RoomEnum,
   *   pos: [row: number, col: number],
   * }} CharacterMapPosition
   */
  /**
   * @typedef {{
   *  id?: PlayerID,
   *  faction: PlayerFaction,
   *  score: number,
   *  items?: PlayerItem[],
   * }} PlayerState
   */

  /**
   * @typedef {{
   *   maps: Record<RoomEnum, Cell[][]>,
   *   position: CharacterMapPosition[],
   *   score: number,
   *   life: number,
   *   items: GameItem[],
   *   players: Record<PlayerID, PlayerState>,
   *   messages: string[],
   *   paused: boolean,
   *   end: boolean,
   * }} GameState
   */

  /**
   * @template TReturn
   * @typedef {(
   *  state: GameState,
   *  cell: Cell | undefined,
   *  dir: Direction,
   * ) => TReturn} EffectFn
   */

  /**
   * @typedef {{
   *  cellType?: [CellType],
   *  fn?: EffectFn<boolean>,
   * }} EffectEnableCondition
   */

  /**
   * @typedef {{
   *  name: string,
   *  enableCondition?: EffectEnableCondition,
   *  effectFn: EffectFn<void>,
   * }} EffectDefinition
   */

  /** @type {EffectDefinition} */
  const DIARY = {
    name: '看日記',
    enableCondition: { t: ['日記'] },
    effectFn: (state) => {
      state.messages.push('日記：沒想到下禮拜天就是 40 歲生日了，真是不得了，去拿蛋糕出來放在茶几上準備慶祝吧');
    },
  };
  /** @type {EffectDefinition} */
  const TAKE_CAKE = {
    name: '拿蛋糕',
    enableCondition: {
      fn: (state, cell, dir) => {
        return cell && (cell.t === '冰箱' || cell.t === '桌' || cell.t === '几') && cell.items?.includes(gameItems.CAKE)
      },
    },
    effectFn: (state, cell, dir) => {
      transferItem(gameItems.CAKE, cell.items ??= [], state.items);
    }
  };
  /** @type {EffectDefinition} */
  const PUT_CAKE = {
    name: '放蛋糕',
    enableCondition: {
      fn: (state, cell, dir) => {
        return cell && (cell.t === '冰箱' || cell.t === '桌' || cell.t === '几') && state.items?.includes(gameItems.CAKE)
      },
    },
    effectFn: (state, cell, dir) => {
      transferItem(gameItems.CAKE, state.items, cell.items ??= []);
    }
  };
  /** @type {EffectDefinition} */
  const HIT_WALL = {
    name: '撞牆',
    enableCondition: { t: ['牆'] },
    effectFn: (state, cell, dir) => {
      state.life -= 4;
      state.messages.push('撞牆受傷，扣 4 點生命值');
    }
  };

  /** @typedef {'+'|'-'|'*'|'/'} ScoreChangeOp */
  /** @typedef {`${ScoreChangeOp}${number}`} ScoreChangeExpr */

  /**
   * @param {ScoreChangeExpr} expr
   * @param {'Character' | PlayerFaction | PlayerID} target
   * @returns {EffectDefinition}
   */
  const makeScoreEffect = (expr, target) => {
    const scoreChangerFn = getScoreChangerFnByExpr(expr);
    return {
      name: '分數' + expr,
      enableCondition: { target },
      effectFn: (state, cell, dir) => {
        // find target players
        let target = {}; // TODO
        const change = parseInt(name.slice(2));
        state.score += delta;
        state.messages.push(`獲得 ${delta} 分`);
        // update target players scores
        target.score = scoreChangerFn(target.score ?? 0);
      },
    }
  };

  /** @type {Record<ScoreChangeOp, (oprand: number) => ((score: number) => number)>} */
  const scoreChangerFnMaker = {
    '+': (oprand) => ((score) => score + oprand),
    '-': (oprand) => ((score) => score - oprand),
    '*': (oprand) => ((score) => score * oprand),
    '/': (oprand) => ((score) => score / oprand),
  };

  /** @type {(expr: ScoreChangeExpr) => ((score: number) => number)} */
  const getScoreChangerFnByExpr = (expr) => {
    /** @type {ScoreChangeOp} */
    const op = expr[0];
    const oprand = Number(expr.substr(1));
    return scoreChangerFnMaker[op](oprand);
  };
}

function getRoomMap() {
  const cells = getCells();
  const table = findCell(cells, (cell) => cell.t === '几');
  const fridge = findCell(cells, (cell) => cell.t === '冰箱');
  return {
    width: 40,
    height: 40,
    cells,
    getTable: () => table,
    getFridge: () => fridge,
  };
}

function getCells() {
  const cells = Array.from({ length: 40 }, (_, i) =>
      Array.from({ length: 40 }, (_, j) =>
        ({})
      )
    );
  {
    // cells[20][20].t = "START";
    // cells[6][13].items = [gameItems.CAKE];
    // cells[6][13].t = "冰箱";
    // cells[21][21].items = [gameItems.CAKE];
    // cells[21][21].t = "冰箱";
    // cells[17][23].t = "日記";
    // cells[20][9].t = "几";
    // cells[17][22].t = "桌";
    // cells[17][24].t = "桌";
    cells[16][10].effects = { [Factions.RED]: '分數+10' };
    cells[16][11].effects = { [Factions.BLUE]: '分數-2' };
    cells[16][12].effects = { [Factions.YELLOW]: '分數*2' };
    cells[16][13].effects = { [Factions.GREEN]: '分數/2' };
    cells[16][14].effects = { [Factions.RED]: '分數+1', [Factions.BLUE]: '分數-1' };

    cells[0][0].t = "牆";
    cells[0][1].t = "牆";
    cells[0][2].t = "牆";
    cells[0][3].t = "牆";
    cells[0][4].t = "牆";
    cells[0][5].t = "牆";
    cells[0][6].t = "牆";
    cells[0][7].t = "牆";
    cells[0][8].t = "牆";
    cells[0][9].t = "牆";
    cells[0][10].t = "牆";
    cells[0][11].t = "牆";
    cells[0][13].t = "人";
    cells[0][15].t = "牆";
    cells[0][16].t = "牆";
    cells[0][17].t = "牆";
    cells[0][18].t = "牆";
    cells[0][19].t = "牆";
    cells[0][20].t = "柵";
    cells[0][21].t = "柵";
    cells[0][22].t = "柵";
    cells[0][23].t = "柵";
    cells[0][24].t = "柵";
    cells[0][25].t = "柵";
    cells[0][26].t = "柵";
    cells[0][27].t = "柵";
    cells[1][0].t = "牆";
    cells[1][1].t = "花";
    cells[1][3].t = "爐";
    cells[1][4].t = "爐";
    cells[1][6].t = "花";
    cells[1][7].t = "牆";
    cells[1][9].t = "花";
    cells[1][11].t = "牆";
    cells[1][12].t = "牆";
    cells[1][13].t = "門";
    cells[1][14].t = "牆";
    cells[1][15].t = "牆";
    cells[1][17].t = "花";
    cells[1][19].t = "牆";
    cells[1][20].t = "花";
    cells[1][24].t = "花";
    cells[1][25].t = "花";
    cells[1][26].t = "花";
    cells[1][27].t = "柵";
    cells[2][0].t = "牆";
    cells[2][7].t = "牆";
    cells[2][19].t = "牆";
    cells[2][23].t = "劍";
    cells[2][26].t = "花";
    cells[2][27].t = "柵";
    cells[3][0].t = "牆";
    cells[3][11].t = "柱";
    cells[3][15].t = "柱";
    cells[3][19].t = "門";
    cells[3][21].t = "劍";
    cells[3][25].t = "樹";
    cells[3][26].t = "花";
    cells[3][27].t = "柵";
    cells[4][0].t = "牆";
    cells[4][2].t = "椅";
    cells[4][3].t = "几";
    cells[4][4].t = "几";
    cells[4][5].t = "椅";
    cells[4][19].t = "牆";
    cells[4][26].t = "花";
    cells[4][27].t = "柵";
    cells[5][0].t = "牆";
    cells[5][3].t = "椅";
    cells[5][4].t = "椅";
    cells[5][7].t = "牆";
    cells[5][10].t = "牆";
    cells[5][11].t = "牆";
    cells[5][12].t = "牆";
    cells[5][13].t = "牆";
    cells[5][14].t = "牆";
    cells[5][15].t = "牆";
    cells[5][16].t = "牆";
    cells[5][19].t = "牆";
    cells[5][20].t = "花";
    cells[5][23].t = "劍";
    cells[5][26].t = "花";
    cells[5][27].t = "柵";
    cells[6][0].t = "牆";
    cells[6][7].t = "牆";
    cells[6][10].t = "牆";
    cells[6][11].t = "櫃";
    cells[6][12].t = "櫃";
    cells[6][13].t = "櫃";
    cells[6][14].t = "櫃";
    cells[6][15].t = "櫃";
    cells[6][16].t = "牆";
    cells[6][19].t = "牆";
    cells[6][24].t = "花";
    cells[6][25].t = "花";
    cells[6][26].t = "花";
    cells[6][27].t = "柵";
    cells[7][0].t = "牆";
    cells[7][1].t = "花";
    cells[7][6].t = "花";
    cells[7][7].t = "牆";
    cells[7][10].t = "牆";
    cells[7][16].t = "牆";
    cells[7][19].t = "牆";
    cells[7][20].t = "櫃";
    cells[7][21].t = "櫃";
    cells[7][22].t = "櫃";
    cells[7][23].t = "櫃";
    cells[7][24].t = "櫃";
    cells[7][25].t = "櫃";
    cells[7][26].t = "櫃";
    cells[7][27].t = "牆";
    cells[8][0].t = "牆";
    cells[8][1].t = "牆";
    cells[8][2].t = "牆";
    cells[8][3].t = "牆";
    cells[8][4].t = "牆";
    cells[8][6].t = "牆";
    cells[8][7].t = "牆";
    cells[8][10].t = "牆";
    cells[8][12].t = "椅";
    cells[8][13].t = "几";
    cells[8][14].t = "椅";
    cells[8][16].t = "牆";
    cells[8][19].t = "牆";
    cells[8][20].t = "櫃";
    cells[8][26].t = "櫃";
    cells[8][27].t = "牆";
    cells[9][0].t = "牆";
    cells[9][7].t = "牆";
    cells[9][10].t = "門";
    cells[9][16].t = "門";
    cells[9][19].t = "門";
    cells[9][22].t = "櫃";
    cells[9][23].t = "櫃";
    cells[9][24].t = "櫃";
    cells[9][26].t = "櫃";
    cells[9][27].t = "牆";
    cells[10][0].t = "牆";
    cells[10][3].t = "椅";
    cells[10][10].t = "牆";
    cells[10][15].t = "桌";
    cells[10][16].t = "牆";
    cells[10][19].t = "牆";
    cells[10][20].t = "櫃";
    cells[10][22].t = "櫃";
    cells[10][23].t = "書";
    cells[10][24].t = "櫃";
    cells[10][27].t = "牆";
    cells[11][0].t = "牆";
    cells[11][2].t = "椅";
    cells[11][3].t = "桌";
    cells[11][4].t = "椅";
    cells[11][7].t = "牆";
    cells[11][8].t = "花";
    cells[11][10].t = "牆";
    cells[11][11].t = "話機";
    cells[11][14].t = "椅";
    cells[11][15].t = "桌";
    cells[11][16].t = "牆";
    cells[11][19].t = "牆";
    cells[11][20].t = "櫃";
    cells[11][22].t = "櫃";
    cells[11][24].t = "櫃";
    cells[11][25].t = "書";
    cells[11][27].t = "牆";
    cells[12][0].t = "牆";
    cells[12][3].t = "桌";
    cells[12][7].t = "牆";
    cells[12][10].t = "牆";
    cells[12][11].t = "牆";
    cells[12][12].t = "牆";
    cells[12][13].t = "門";
    cells[12][14].t = "牆";
    cells[12][15].t = "牆";
    cells[12][16].t = "牆";
    cells[12][18].t = "花";
    cells[12][19].t = "牆";
    cells[12][20].t = "櫃";
    cells[12][22].t = "櫃";
    cells[12][23].t = "書";
    cells[12][24].t = "櫃";
    cells[12][25].t = "書";
    cells[12][27].t = "牆";
    cells[13][0].t = "牆";
    cells[13][2].t = "椅";
    cells[13][3].t = "桌";
    cells[13][4].t = "椅";
    cells[13][6].t = "爐";
    cells[13][7].t = "牆";
    cells[13][10].t = "牆";
    cells[13][11].t = "桌";
    cells[13][12].t = "日記";
    cells[13][15].t = "月曆";
    cells[13][16].t = "牆";
    cells[13][19].t = "牆";
    cells[13][20].t = "櫃";
    cells[13][22].t = "櫃";
    cells[13][23].t = "書";
    cells[13][27].t = "牆";
    cells[14][0].t = "牆";
    cells[14][3].t = "桌";
    cells[14][7].t = "牆";
    cells[14][10].t = "牆";
    cells[14][12].t = "椅";
    cells[14][16].t = "牆";
    cells[14][19].t = "牆";
    cells[14][20].t = "櫃";
    cells[14][22].t = "櫃";
    cells[14][23].t = "桌";
    cells[14][24].t = "椅";
    cells[14][26].t = "書";
    cells[14][27].t = "牆";
    cells[15][0].t = "牆";
    cells[15][2].t = "椅";
    cells[15][3].t = "桌";
    cells[15][4].t = "椅";
    cells[15][7].t = "牆";
    cells[15][8].t = "花";
    cells[15][10].t = "門";
    cells[15][13].t = "鞋";
    cells[15][16].t = "門";
    cells[15][19].t = "牆";
    cells[15][20].t = "櫃";
    cells[15][22].t = "櫃";
    cells[15][23].t = "書";
    cells[15][26].t = "櫃";
    cells[15][27].t = "牆";
    cells[16][0].t = "牆";
    cells[16][3].t = "椅";
    cells[16][10].t = "牆";
    cells[16][16].t = "牆";
    cells[16][19].t = "牆";
    cells[16][20].t = "櫃";
    cells[16][22].t = "櫃";
    cells[16][23].t = "書";
    cells[16][24].t = "書";
    cells[16][26].t = "櫃";
    cells[16][27].t = "牆";
    cells[17][0].t = "牆";
    cells[17][7].t = "牆";
    cells[17][10].t = "牆";
    cells[17][11].t = "衣櫃";
    cells[17][12].t = "衣櫃";
    cells[17][14].t = "床";
    cells[17][15].t = "櫃";
    cells[17][16].t = "牆";
    cells[17][19].t = "牆";
    cells[17][20].t = "櫃";
    cells[17][22].t = "櫃";
    cells[17][23].t = "書";
    cells[17][26].t = "櫃";
    cells[17][27].t = "牆";
    cells[18][0].t = "牆";
    cells[18][1].t = "牆";
    cells[18][2].t = "牆";
    cells[18][3].t = "牆";
    cells[18][4].t = "牆";
    cells[18][6].t = "牆";
    cells[18][7].t = "牆";
    cells[18][10].t = "牆";
    cells[18][11].t = "牆";
    cells[18][12].t = "牆";
    cells[18][13].t = "門";
    cells[18][14].t = "牆";
    cells[18][15].t = "牆";
    cells[18][16].t = "牆";
    cells[18][19].t = "牆";
    cells[18][20].t = "櫃";
    cells[18][26].t = "櫃";
    cells[18][27].t = "牆";
    cells[19][0].t = "牆";
    cells[19][1].t = "爐";
    cells[19][2].t = "爐";
    cells[19][3].t = "台";
    cells[19][4].t = "槽";
    cells[19][6].t = "櫃";
    cells[19][7].t = "牆";
    cells[19][18].t = "花";
    cells[19][19].t = "牆";
    cells[19][20].t = "櫃";
    cells[19][21].t = "櫃";
    cells[19][22].t = "櫃";
    cells[19][23].t = "櫃";
    cells[19][24].t = "櫃";
    cells[19][25].t = "櫃";
    cells[19][26].t = "櫃";
    cells[19][27].t = "牆";
    cells[20][0].t = "牆";
    cells[20][7].t = "牆";
    cells[20][10].t = "牆";
    cells[20][11].t = "牆";
    cells[20][12].t = "牆";
    cells[20][13].t = "門";
    cells[20][14].t = "牆";
    cells[20][15].t = "牆";
    cells[20][16].t = "牆";
    cells[20][17].t = "門";
    cells[20][18].t = "牆";
    cells[20][19].t = "牆";
    cells[20][20].t = "牆";
    cells[20][21].t = "牆";
    cells[20][22].t = "牆";
    cells[20][23].t = "牆";
    cells[20][24].t = "牆";
    cells[20][25].t = "牆";
    cells[20][26].t = "牆";
    cells[20][27].t = "牆";
    cells[21][0].t = "牆";
    cells[21][3].t = "台";
    cells[21][4].t = "台";
    cells[21][5].t = "台";
    cells[21][10].t = "牆";
    cells[21][11].t = "槽";
    cells[21][12].t = "槽";
    cells[21][14].t = "花";
    cells[21][15].t = "牆";
    cells[21][16].t = "牆";
    cells[21][18].t = "牆";
    cells[21][19].t = "按鈕";
    cells[21][20].t = "銀";
    cells[21][21].t = "牆";
    cells[21][22].t = "牆";
    cells[21][23].t = "牆";
    cells[21][24].t = "牆";
    cells[21][25].t = "牆";
    cells[21][26].t = "牆";
    cells[21][27].t = "牆";
    cells[22][0].t = "牆";
    cells[22][7].t = "牆";
    cells[22][10].t = "牆";
    cells[22][15].t = "牆";
    cells[22][16].t = "牆";
    cells[22][18].t = "牆";
    cells[22][19].t = "牆";
    cells[22][26].t = "金";
    cells[22][27].t = "牆";
    cells[23][0].t = "牆";
    cells[23][1].t = "冰箱";
    cells[23][2].t = "櫃";
    cells[23][3].t = "櫃";
    cells[23][4].t = "櫃";
    cells[23][6].t = "桶";
    cells[23][7].t = "牆";
    cells[23][10].t = "牆";
    cells[23][11].t = "門";
    cells[23][12].t = "牆";
    cells[23][13].t = "門";
    cells[23][14].t = "牆";
    cells[23][15].t = "牆";
    cells[23][16].t = "牆";
    cells[23][18].t = "牆";
    cells[23][19].t = "牆";
    cells[23][20].t = "牆";
    cells[23][21].t = "牆";
    cells[23][23].t = "牆";
    cells[23][24].t = "牆";
    cells[23][25].t = "牆";
    cells[23][26].t = "牆";
    cells[23][27].t = "牆";
    cells[24][0].t = "牆";
    cells[24][1].t = "牆";
    cells[24][2].t = "牆";
    cells[24][3].t = "牆";
    cells[24][4].t = "牆";
    cells[24][5].t = "牆";
    cells[24][6].t = "牆";
    cells[24][7].t = "牆";
    cells[24][8].t = "門";
    cells[24][9].t = "牆";
    cells[24][10].t = "牆";
    cells[24][12].t = "牆";
    cells[24][15].t = "牆";
    cells[24][16].t = "牆";
    cells[24][23].t = "牆";
    cells[24][24].t = "牆";
    cells[24][25].t = "牆";
    cells[24][26].t = "牆";
    cells[24][27].t = "牆";
    cells[25][0].t = "柵";
    cells[25][1].t = "花";
    cells[25][2].t = "花";
    cells[25][3].t = "花";
    cells[25][4].t = "花";
    cells[25][5].t = "花";
    cells[25][6].t = "花";
    cells[25][7].t = "花";
    cells[25][10].t = "牆";
    cells[25][11].t = "馬桶";
    cells[25][12].t = "牆";
    cells[25][14].t = "浴缸";
    cells[25][15].t = "牆";
    cells[25][16].t = "牆";
    cells[25][17].t = "牆";
    cells[25][18].t = "牆";
    cells[25][19].t = "牆";
    cells[25][20].t = "牆";
    cells[25][21].t = "牆";
    cells[25][22].t = "牆";
    cells[25][23].t = "牆";
    cells[25][24].t = "牆";
    cells[25][25].t = "桶";
    cells[25][26].t = "桶";
    cells[25][27].t = "柵";
    cells[26][0].t = "柵";
    cells[26][2].t = "樹";
    cells[26][3].t = "人";
    cells[26][4].t = "花";
    cells[26][7].t = "樹";
    cells[26][10].t = "牆";
    cells[26][11].t = "牆";
    cells[26][12].t = "牆";
    cells[26][13].t = "牆";
    cells[26][14].t = "牆";
    cells[26][15].t = "牆";
    cells[26][16].t = "牆";
    cells[26][17].t = "牆";
    cells[26][18].t = "牆";
    cells[26][19].t = "牆";
    cells[26][20].t = "牆";
    cells[26][21].t = "牆";
    cells[26][22].t = "牆";
    cells[26][23].t = "牆";
    cells[26][24].t = "牆";
    cells[26][25].t = "人";
    cells[26][27].t = "柵";
    cells[27][0].t = "柵";
    cells[27][1].t = "花";
    cells[27][2].t = "花";
    cells[27][3].t = "花";
    cells[27][4].t = "花";
    cells[27][5].t = "花";
    cells[27][6].t = "花";
    cells[27][7].t = "花";
    cells[27][13].t = "花";
    cells[27][21].t = "花";
    cells[27][24].t = "門";
    cells[27][27].t = "柵";
    cells[28][0].t = "柵";
    cells[28][1].t = "柵";
    cells[28][2].t = "柵";
    cells[28][3].t = "柵";
    cells[28][4].t = "柵";
    cells[28][5].t = "柵";
    cells[28][6].t = "柵";
    cells[28][7].t = "柵";
    cells[28][11].t = "樹";
    cells[28][17].t = "樹";
    cells[28][19].t = "樹";
    cells[28][24].t = "柵";
    cells[28][25].t = "柵";
    cells[28][26].t = "柵";
    cells[28][27].t = "柵";
  }
return cells;
}
