/**
 * Hungarian Algorithm (Kuhn-Munkres) for Optimal Bipartite Association
 * Used for deep tracking association (Detections <-> Tracks) and identity assignment (Tracks <-> Students).
 */

export interface BoxCoordinates {
  bx1: number;
  by1: number;
  bw: number;
  bh: number;
}

/**
 * Computes Intersection-over-Union (IoU) between two bounding boxes
 */
export function computeIoU(boxA: BoxCoordinates, boxB: BoxCoordinates): number {
  const x1 = Math.max(boxA.bx1, boxB.bx1);
  const y1 = Math.max(boxA.by1, boxB.by1);
  const x2 = Math.min(boxA.bx1 + boxA.bw, boxB.bx1 + boxB.bw);
  const y2 = Math.min(boxA.by1 + boxA.bh, boxB.by1 + boxB.bh);

  const intersectionW = Math.max(0, x2 - x1);
  const intersectionH = Math.max(0, y2 - y1);
  const intersectionArea = intersectionW * intersectionH;

  const areaA = boxA.bw * boxA.bh;
  const areaB = boxB.bw * boxB.bh;
  const unionArea = areaA + areaB - intersectionArea;

  if (unionArea <= 0) return 0;
  return intersectionArea / unionArea;
}

export interface HungarianMatch {
  row: number; // e.g., detection index or track index
  col: number; // e.g., track index or student index
  cost: number;
}

/**
 * Solves the minimum-cost bipartite matching problem for an M x N cost matrix.
 * Handles rectangular matrices via square padding.
 */
export function hungarianAlgorithm(
  costMatrix: number[][],
  maxGatedCost: number = 1e4
): HungarianMatch[] {
  const numRows = costMatrix.length;
  if (numRows === 0) return [];
  const numCols = costMatrix[0].length;
  if (numCols === 0) return [];

  const dim = Math.max(numRows, numCols);
  const INF = 1e7;

  // Build square matrix
  const matrix: number[][] = Array.from({ length: dim }, (_, r) => {
    const row = new Array(dim).fill(INF);
    if (r < numRows) {
      for (let c = 0; c < numCols; c++) {
        row[c] = costMatrix[r][c];
      }
    }
    return row;
  });

  // Dual variables u (row potentials), v (column potentials)
  const u = new Array(dim + 1).fill(0);
  const v = new Array(dim + 1).fill(0);
  const p = new Array(dim + 1).fill(0); // Matching for columns (1-indexed)
  const way = new Array(dim + 1).fill(0);

  for (let i = 1; i <= dim; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(dim + 1).fill(INF);
    const used = new Array(dim + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = INF;
      let j1 = 0;

      for (let j = 1; j <= dim; j++) {
        if (!used[j]) {
          const cur = matrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= dim; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // Extract assignments (converting from 1-based indexing)
  const matches: HungarianMatch[] = [];
  for (let col = 1; col <= dim; col++) {
    const row = p[col] - 1;
    if (row < numRows && col - 1 < numCols) {
      const cost = costMatrix[row][col - 1];
      if (cost < maxGatedCost) {
        matches.push({ row, col: col - 1, cost });
      }
    }
  }

  return matches;
}
