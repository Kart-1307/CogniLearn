/**
 * Constant-Velocity 2D Bounding Box Kalman Filter for Multi-Face Tracking (DeepSORT-lite)
 * State: [cx, cy, w, h, v_cx, v_cy, v_w, v_h]^T
 * Measurement: [cx, cy, w, h]^T
 */

export interface BoundingBox {
  cx: number;
  cy: number;
  w: number;
  h: number;
  bx1: number;
  by1: number;
  bw: number;
  bh: number;
}

export class BoundingBoxKalmanFilter {
  // 8-element state vector: [cx, cy, w, h, v_cx, v_cy, v_w, v_h]
  private x: number[];
  // 8x8 covariance matrix
  private P: number[][];
  // Process noise standard deviations
  private stdWeightPosition = 1.0 / 20;
  private stdWeightVelocity = 1.0 / 160;

  constructor(initialBox: { cx: number; cy: number; w: number; h: number }) {
    this.x = [initialBox.cx, initialBox.cy, initialBox.w, initialBox.h, 0, 0, 0, 0];

    // Initial covariance
    this.P = Array.from({ length: 8 }, (_, i) => {
      const row = new Array(8).fill(0);
      if (i < 4) {
        // High confidence on initial position
        const std = 2 * this.stdWeightPosition * (i === 2 || i === 3 ? initialBox.h : initialBox.h);
        row[i] = Math.max(1, std * std);
      } else {
        // Higher uncertainty on initial velocity
        const std = 10 * this.stdWeightVelocity * initialBox.h;
        row[i] = Math.max(10, std * std);
      }
      return row;
    });
  }

  /**
   * Predict the next state estimate using constant velocity model:
   * x_t = x_{t-1} + v * dt
   */
  public predict(): BoundingBox {
    // 1. Update state: x = F * x where dt = 1.0 frame
    this.x[0] += this.x[4];
    this.x[1] += this.x[5];
    this.x[2] += this.x[6];
    this.x[3] += this.x[7];

    // Ensure non-negative width & height
    this.x[2] = Math.max(10, this.x[2]);
    this.x[3] = Math.max(10, this.x[3]);

    // 2. Process noise Q
    const h = this.x[3];
    const stdPos = Math.max(1e-2, this.stdWeightPosition * h);
    const stdVel = Math.max(1e-3, this.stdWeightVelocity * h);
    const qPos = stdPos * stdPos;
    const qVel = stdVel * stdVel;

    for (let i = 0; i < 4; i++) {
      this.P[i][i] += this.P[i + 4][i] + this.P[i][i + 4] + this.P[i + 4][i + 4] + qPos;
      this.P[i][i + 4] += this.P[i + 4][i + 4];
      this.P[i + 4][i] += this.P[i + 4][i + 4];
      this.P[i + 4][i + 4] += qVel;
    }

    return this.getBoundingBox();
  }

  /**
   * Correct the state estimate with a new detection measurement [cx, cy, w, h]
   */
  public update(measurement: { cx: number; cy: number; w: number; h: number }): BoundingBox {
    const z = [measurement.cx, measurement.cy, measurement.w, measurement.h];

    // Innovation y = z - H * x
    const y = [
      z[0] - this.x[0],
      z[1] - this.x[1],
      z[2] - this.x[2],
      z[3] - this.x[3],
    ];

    // Measurement noise R
    const h = this.x[3];
    const stdMeasure = Math.max(1.0, this.stdWeightPosition * h);
    const r = stdMeasure * stdMeasure;

    // S = H * P * H^T + R (diagonal 4x4 matrix for independent measurements)
    const S = [
      this.P[0][0] + r,
      this.P[1][1] + r,
      this.P[2][2] + r,
      this.P[3][3] + r,
    ];

    // Kalman gain K = P * H^T * S^-1 (8x4 matrix)
    const K: number[][] = Array.from({ length: 8 }, (_, i) => [
      this.P[i][0] / S[0],
      this.P[i][1] / S[1],
      this.P[i][2] / S[2],
      this.P[i][3] / S[3],
    ]);

    // x = x + K * y
    for (let i = 0; i < 8; i++) {
      let delta = 0;
      for (let j = 0; j < 4; j++) {
        delta += K[i][j] * y[j];
      }
      this.x[i] += delta;
    }

    // P = (I - K * H) * P
    const newP: number[][] = Array.from({ length: 8 }, () => new Array(8).fill(0));
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        let sum = this.P[i][j];
        for (let k = 0; k < 4; k++) {
          sum -= K[i][k] * this.P[k][j];
        }
        newP[i][j] = sum;
      }
    }
    this.P = newP;

    // Enforce valid dimensions
    this.x[2] = Math.max(10, this.x[2]);
    this.x[3] = Math.max(10, this.x[3]);

    return this.getBoundingBox();
  }

  /**
   * Returns current bounding box in both center and corner coordinates
   */
  public getBoundingBox(): BoundingBox {
    const cx = this.x[0];
    const cy = this.x[1];
    const w = this.x[2];
    const h = this.x[3];
    const bx1 = Math.round(cx - w / 2);
    const by1 = Math.round(cy - h / 2);
    const bw = Math.round(w);
    const bh = Math.round(h);

    return { cx, cy, w, h, bx1, by1, bw, bh };
  }
}
