import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@2.4.0";
import * as dat from "https://cdn.skypack.dev/dat.gui@0.7.7";
import VueGlobalEvents from "https://cdn.skypack.dev/vue-global-events@1.2.1";

Vue.component('VueGlobalEvents', VueGlobalEvents)

const simplexX = new SimplexNoise();
const simplexY = new SimplexNoise();

new Vue({
  el: '#app',
  data: () => ({
    status: 'playing',
    width: undefined,
    height: undefined,
    options: {
      resolution: 2,
      cellWidth: 100,
      cellHeight: 140,
      noiseXInFactor: 1 / 400,
      noiseYInFactor: 1 / 400,
      noiseTInFactor: 1 / 4000,
      noiseTInOffset: 0.1,
      noiseXOutFactor: 50,
      noiseYOutFactor: 50
    }
  }),
  mounted() {
    this.setSize();
    this.init();
    this.frame();

    const gui = new dat.GUI();
    this.gui = gui;

    gui.add(this.options, 'resolution', 1, 3, 1);
    gui.add(this.options, 'cellWidth', 30, 200);
    gui.add(this.options, 'cellHeight', 30, 200);
    gui.add(this.options, 'noiseXInFactor', 0, 0.01);
    gui.add(this.options, 'noiseYInFactor', 0, 0.01);
    gui.add(this.options, 'noiseTInFactor', 0, 0.003);
    gui.add(this.options, 'noiseTInOffset', 0.01, 1);
    gui.add(this.options, 'noiseXOutFactor', 0, 200);
    gui.add(this.options, 'noiseYOutFactor', 0, 200);
  },
  beforeDestroy() {
    cancelAnimationFrame(this.frameId);

    if (this.gui) {
      this.gui.destroy();
    }
  },
  methods: {
    setSize() {
      const canvas = this.$refs.canvas;
      this.ctx = canvas.getContext('2d');

      const dpr = window.devicePixelRatio;
      this.width = canvas.clientWidth * dpr;
      this.height = canvas.clientHeight * dpr;
      canvas.width = this.width;
      canvas.height = this.height;
    },
    init() {
    this.setSize()
    },
    frame(timestamp = 0) {
      this.frameId = requestAnimationFrame(this.frame);

      if (this.status === 'paused') {
        return;
      }

      const { ctx, width, height } = this;
      const { noiseTInFactor } = this.options;

      ctx.clearRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'multiply';

      ctx.fillStyle = 'red';
      this.drawGrid(timestamp * noiseTInFactor);

      ctx.fillStyle = 'blue';
      this.drawGrid(timestamp * noiseTInFactor + this.options.noiseTInOffset);
    },
    drawGrid(t) {
      const { ctx, width, height } = this;

      const {
        resolution,
        cellWidth,
        cellHeight,
        noiseXInFactor,
        noiseYInFactor,
        noiseXOutFactor,
        noiseYOutFactor
      } = this.options;

      const cellsX = Math.ceil(width / cellWidth);
      const cellsY = Math.ceil(height / cellHeight);

      const warp = ([x, y]) => {
        const noiseX =
          simplexX.noise3D(x * noiseXInFactor, y * noiseYInFactor, t) *
          noiseXOutFactor;
        const noiseY =
          simplexY.noise3D(x * noiseXInFactor, y * noiseYInFactor, t) *
          noiseYOutFactor;

        return [x + noiseX, y + noiseY];
      };

      const lineBetween = (a, b) => {
        const divisions = { 1: 3, 2: 5, 3: 8 }[resolution];
        const offset = [(b[0] - a[0]) / divisions, (b[1] - a[1]) / divisions];

        for (let i = 0; i <= divisions; i++) {
          ctx.lineTo(...warp([a[0] + offset[0] * i, a[1] + offset[1] * i]));
        }
      };

      for (let i = -1; i <= cellsX; i++) {
        for (let j = -1; j <= cellsY; j++) {
          // Only draw every other rectangle
          if (Math.abs(i % 2) !== Math.abs(j % 2)) {
            continue;
          }

          const startX = i * cellWidth;
          const startY = j * cellHeight;

          ctx.beginPath();
          ctx.moveTo(...warp([startX, startY]));
          lineBetween([startX, startY], [startX + cellWidth, startY]);
          lineBetween(
            [startX + cellWidth, startY],
            [startX + cellWidth, startY + cellHeight]
          );
          lineBetween(
            [startX + cellWidth, startY + cellHeight],
            [startX, startY + cellHeight]
          );
          lineBetween([startX, startY + cellHeight], [startX, startY]);
          ctx.fill();
        }
      }
    }
  }
});