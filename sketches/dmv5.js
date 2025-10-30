// ------------------ V.5: Agent Drawing Machine ------------------
window.sketch5 = (p) => {
  // ------------------ Variables ------------------
  let branchingFactorSlider, noiseFactorSlider, headingFactorSlider, rectSizeSlider;
  let branchingFactor = 0.025, noiseFactor = 100, headingFactor = 3, rectSize = 66;
  const agentArray = [];
  const agentSpeed = 150;
  let world, agentFinished = false;
  let allColors = [], colors = [], currentColor;
  let currentPaletteIndex = 0, colorChangeInterval, intervalTime;
  let pauseStartFrame = null, isPausedBeforeReset = false;
  const maxRunTime = 1200;
  let agentStartFrame = 0;

  // ------------------ Setup ------------------
  p.setup = () => {
    const container = p.select("#drawing-machine-canvas");
    p.createCanvas(container.width, container.height).parent(container);
    p.noFill();
    p.noiseSeed();

    setupSliders();
    setupPalettes();
    resetForNewRun();
  };

  // ------------------ Draw ------------------
  p.draw = () => {
    branchingFactor = branchingFactorSlider.value();
    noiseFactor = noiseFactorSlider.value();
    headingFactor = headingFactorSlider.value();
    rectSize = rectSizeSlider.value();

    if (!isPausedBeforeReset) {
      if (p.frameCount % 2 === 0) {
        for (let i = 0; i < agentSpeed / 2; i++) {
          agentArray.forEach(agent => agent.next());
        }
      }
    }

    if (agentFinished && !isPausedBeforeReset) {
      disableSliders();
      isPausedBeforeReset = true;
      pauseStartFrame = p.frameCount;
    }

    if (isPausedBeforeReset && p.frameCount - pauseStartFrame > 15 * 60) {
      agentFinished = false;
      isPausedBeforeReset = false;
      switchPalette();
    }
  };

  // ------------------ Helpers ------------------
  function setupSliders() {
    const sliderContainer = p.createDiv().parent(p.select("#controls"))
      .style("display", "flex")
      .style("justify-content", "space-around")
      .style("align-items", "center")
      .style("gap", "20px");

    const bfDiv = p.createDiv().parent(sliderContainer);
    bfDiv.child(p.createP("Branching Factor"));
    branchingFactorSlider = p.createSlider(0.001, 0.05, branchingFactor, 0.001).parent(bfDiv);

    const nfDiv = p.createDiv().parent(sliderContainer);
    nfDiv.child(p.createP("Noise Factor"));
    noiseFactorSlider = p.createSlider(0, 500, noiseFactor, 1).parent(nfDiv);

    const hfDiv = p.createDiv().parent(sliderContainer);
    hfDiv.child(p.createP("Heading Factor"));
    headingFactorSlider = p.createSlider(1, 35, headingFactor, 1).parent(hfDiv);

    const rsDiv = p.createDiv().parent(sliderContainer);
    rsDiv.child(p.createP("Rect Size"));
    rectSizeSlider = p.createSlider(2, 66, rectSize, 2).parent(rsDiv);
  }

  function setupPalettes() {
    allColors = [
      [p.color(1,31,75), p.color(3,57,108), p.color(0,91,150), p.color(100,151,177), p.color(179,205,224)],
      [p.color(228,237,242), p.color(205,226,238), p.color(187,220,240), p.color(168,218,249), p.color(146,210,249)], 
      [p.color(0,191,255), p.color(0,159,255), p.color(0,128,255), p.color(0,96,255), p.color(0,64,255)], 
      [p.color(0,0,175), p.color(49,0,196), p.color(91,0,181), p.color(122,0,163), p.color(153,0,153)], 
      [p.color(0,212,144), p.color(0,186,127), p.color(0,136,93), p.color(218,109,255), p.color(238,187,255)],
      [p.color(147,210,202), p.color(108,152,184), p.color(56,104,133), p.color(23,79,114), p.color(8,42,79)],
      [p.color(33,102,84), p.color(97,120,125), p.color(26,72,68), p.color(65,96,101), p.color(143,176,175)]
    ];
  }

  function pickRandomColor() { currentColor = p.random(colors); }

  function startColorChange() {
    clearInterval(colorChangeInterval);
    colorChangeInterval = setInterval(() => {
      pickRandomColor();
      intervalTime = Math.min(intervalTime * 1.2, 10000);
      startColorChange();
    }, intervalTime);
  }

  function switchPalette() {
    currentPaletteIndex = (currentPaletteIndex + 1) % allColors.length;
    resetForNewRun();
  }

  function* agent() {
    const stack = [{ x: p.random(p.width), y: p.random(p.height), heading: p.random(p.TWO_PI) }];
    world.set(stack[0].x, stack[0].y);

    while (p.frameCount - agentStartFrame < maxRunTime) {
      if (stack.length === 0) {
        let tries = 0;
        while (tries < 100) {
          const x = p.random(p.width), y = p.random(p.height);
          if (world.canMoveTo(x, y)) { stack.push({ x, y, heading: p.random(p.TWO_PI) }); break; }
          tries++;
        }
        if (tries >= 100) break;
      }

      let { x, y, heading } = stack.pop();
      const boostBranching = stack.length < 5 ? branchingFactor * 4 : branchingFactor;
      const num = p.random() < boostBranching ? 2 : 1;

      for (let i = 0; i < num; i++, heading += p.PI / headingFactor) {
        let newX = x, newY = y;
        do {
          let n = p.noise(newX / p.width, newY / p.height) * noiseFactor;
          newX = (newX + p.sin(heading + n) + p.width) % p.width;
          newY = (newY + p.cos(heading + n) + p.height) % p.height;
        } while (Math.floor(newX) === Math.floor(x) && Math.floor(newY) === Math.floor(y));

        if (!world.canMoveTo(newX, newY)) continue;
        stack.push({ x: newX, y: newY, heading });
        world.set(newX, newY);
        yield;
      }
    }

    agentFinished = true;
  }

  function array2d() {
    const w = Math.floor(p.width), h = Math.floor(p.height);
    const array = Array.from({ length: w }, () => Array(h).fill(false));
    return {
      canMoveTo: (x, y) => array[Math.floor(x)][Math.floor(y)] === false,
      set: (x, y) => {
        array[Math.floor(x)][Math.floor(y)] = true;
        p.stroke(currentColor);
        p.rect(x, y, rectSize, rectSize);
      }
    };
  }

  function disableSliders() {
    [branchingFactorSlider, noiseFactorSlider, headingFactorSlider, rectSizeSlider].forEach(s => {
      s.style("background", "black").attribute("disabled", true);
    });
  }

  function enableSliders() {
    [branchingFactorSlider, noiseFactorSlider, headingFactorSlider, rectSizeSlider].forEach(s => {
      s.style("background", "blue").removeAttribute("disabled");
    });
  }

  function resetForNewRun() {
    p.background("white");
    colors = allColors[currentPaletteIndex];
    pickRandomColor();
    intervalTime = p.random(1000, 3000);
    startColorChange();
    world = array2d();
    agentArray.length = 0;
    agentStartFrame = p.frameCount;
    agentArray.push(agent());
    agentFinished = false;
    enableSliders();
  }

  p.windowResized = () => {
    const container = p.select("#drawing-machine-canvas");
    p.resizeCanvas(container.width, container.height);
    resetForNewRun();
  };

  p.keyPressed = () => {
    if (p.key === 'f' || p.key === 'F') {
      let fs = p.fullscreen();
      p.fullscreen(!fs);
      if (!fs) p.background("white");
      setTimeout(() => {
        const container = p.select("#drawing-machine-canvas");
        p.resizeCanvas(container.width, container.height);
        resetForNewRun();
      }, 100);
    }
  };
};
