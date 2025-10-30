// ------------------ V.3A: Multi-Color Motion-Based Drawing Machine w/ Continuous Palette Cycling ------------------
window.sketch3A = (p) => {
  const branchingFactor = 2;
  let motionFactor = 50;
  let agentSpeed = 20;
  const agentArray = [];
  let world;
  let video;
  let prevFrame;
  const motionThreshold = 50; 
  const fadeAmount = 2;

  // --- Color palettes ---
  const colorPalettes = [
    [p.color(77, 238, 234), p.color(0, 150, 150), p.color(0, 200, 255)],
    [p.color(255, 100, 100), p.color(200, 50, 50), p.color(255, 150, 150)],
    [p.color(100, 255, 100), p.color(50, 200, 50), p.color(150, 255, 150)],
    [p.color(255, 255, 100), p.color(200, 200, 50), p.color(255, 255, 150)],
    [p.color(180, 100, 255), p.color(150, 50, 200), p.color(200, 150, 255)],
    [p.color(255, 180, 100), p.color(200, 150, 50), p.color(255, 200, 150)]
  ];
  let currentPaletteIndex = 0;
  let currentColors = colorPalettes[currentPaletteIndex];

  // --- Palette cycling speed ---
  const paletteCycleInterval = 1000; // every 2 seconds
  let lastPaletteSwitch = 0;

  p.setup = () => {
    const container = p.select("#drawing-machine-canvas");
    p.createCanvas(container.width, container.height).parent(container);
    p.noFill();
    p.noiseSeed();
    p.background(0);

    video = p.createCapture(p.VIDEO);
    video.size(160, 120);
    video.hide();
    prevFrame = p.createImage(video.width, video.height);

    buildWorld();
  };

  function buildWorld() {
    p.background(0);
    world = array2d();
    agentArray.length = 0;

    for (let i = 0; i < 15; i++) {
      agentArray.push(agent());
    }
  }

  // --- Click resets world but keeps palette index ---
  p.mouseClicked = () => buildWorld();

  p.windowResized = () => {
    const container = p.select("#drawing-machine-canvas");
    p.resizeCanvas(container.width, container.height);
    buildWorld();
  };

  p.draw = () => {
    // --- Cycle palettes continuously ---
    if (p.millis() - lastPaletteSwitch > paletteCycleInterval) {
      currentPaletteIndex = (currentPaletteIndex + 1) % colorPalettes.length;
      currentColors = colorPalettes[currentPaletteIndex];
      lastPaletteSwitch = p.millis();
    }

    // --- Background fade ---
    p.fill(0, fadeAmount);
    p.noStroke();
    p.rect(0, 0, p.width, p.height);

    // --- Video motion detection ---
    video.loadPixels();
    prevFrame.loadPixels();

    let motionLevel = 0;
    if (video.pixels.length > 0 && prevFrame.pixels.length > 0) {
      for (let i = 0; i < video.pixels.length; i += 4) {
        const currBrightness = (video.pixels[i] + video.pixels[i + 1] + video.pixels[i + 2]) / 3;
        const prevBrightness = (prevFrame.pixels[i] + prevFrame.pixels[i + 1] + prevFrame.pixels[i + 2]) / 3;
        const diff = Math.abs(currBrightness - prevBrightness);
        if (diff > motionThreshold) motionLevel++;
      }
    }

    motionLevel = p.map(motionLevel, 0, (video.width * video.height) / 2, 0, 1);

    if (motionLevel > 0.01) {
      motionFactor = p.map(motionLevel, 0.01, 1, 20, 80);
      agentSpeed = p.map(motionLevel, 0.01, 1, 5, 40);
    } else {
      agentSpeed = 10;
    }

    if (agentSpeed > 0) {
      for (let i = 0; i < Math.ceil(agentSpeed / 3); i++) {
        agentArray.forEach((agentGen, j) => {
          const result = agentGen.next();
          if (result.done) agentArray[j] = agent();
        });
      }
    }

    if (motionLevel > 0.5 && agentArray.length < 30) {
      agentArray.push(agent());
    }

    prevFrame.copy(video, 0, 0, video.width, video.height, 0, 0, video.width, video.height);
    prevFrame.updatePixels();
  };

  function* agent() {
    let x = p.random(p.width);
    let y = p.random(p.height);
    let heading = p.random(p.TWO_PI); 
    const stack = [{ x, y, heading }];
    world.set(x, y);

    while (stack.length) {
      let { x, y, heading } = stack.pop();
      const num = p.random() < branchingFactor ? 2 : 1;

      for (let i = 0; i < num; i++, heading += p.random(-p.PI / 8, p.PI / 8)) {
        let newX = x;
        let newY = y;
        let bounced = false;

        do {
          const n = p.noise(newX / p.width, newY / p.height) * motionFactor;
          newX = newX + p.cos(heading + n);
          newY = newY + p.sin(heading + n);

          // bounce freely across canvas
          if (newX < 0) { newX = 0; heading = p.random(p.TWO_PI); bounced = true; }
          else if (newX >= p.width) { newX = p.width - 1; heading = p.random(p.TWO_PI); bounced = true; }
          if (newY < 0) { newY = 0; heading = p.random(p.TWO_PI); bounced = true; }
          else if (newY >= p.height) { newY = p.height - 1; heading = p.random(p.TWO_PI); bounced = true; }
        } while (!bounced && p.floor(newX) === p.floor(x) && p.floor(newY) === p.floor(y));

        if (world.canMoveTo(newX, newY)) {
          stack.push({ x: newX, y: newY, heading });
          world.set(newX, newY);
          yield;
        }
      }
    }
  }

  function array2d() {
    const array = Array.from({ length: p.width }, () => Array(p.height).fill(false));
    return {
      canMoveTo: (x, y) => array[p.floor(x)][p.floor(y)] === false,
      set: (x, y) => {
        // --- Pick random color from CURRENT palette at each step ---
        const col = p.random(currentColors);
        p.stroke(col);
        array[p.floor(x)][p.floor(y)] = true;
        p.point(x, y);
      }
    };
  }
};
