let particleSketch = (p) => {
  // ----------------- Variables -----------------
  let cols, rows, scl = 50, flowfield;
  let particles = [];
  let allColors = [], currentPaletteIndex = 0, currentPalette;
  let resetTimer = null, justWentFullscreen = false;
  let trailLayer, fadeOpacity = 255, isFading = false;

  // UI sliders
  let sizeSlider, trailSlider, fadeSlider, speedSlider, particleSlider;
  const containerId = "interwork"; // div ID for this sketch

  // ----------------- p.setup -----------------
  p.setup = () => {
    const container = document.getElementById(containerId);
    p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);
    trailLayer = p.createGraphics(container.offsetWidth, container.offsetHeight);

    setupPalettes();
    setupSliders(container);
    resetSketch();
  };

  // ----------------- p.draw -----------------
  p.draw = () => {
    p.image(trailLayer, 0, 0);

    trailLayer.noStroke();
    trailLayer.fill(0, 0, 0, fadeSlider.value());
    trailLayer.rect(0, 0, p.width, p.height);

    let totalMovement = 0;

    // Adjust particle count
    let desiredCount = particleSlider.value();
    while (particles.length < desiredCount) particles.push(new Particle());
    while (particles.length > desiredCount) particles.pop();

    for (let particle of particles) {
      if (p.frameCount % 2 === 0) totalMovement += particle.update(flowfield);
      if (p.frameCount % 3 === 0) particle.show(trailLayer);
    }

    if (isFading) {
      p.fill(0, fadeOpacity);
      p.noStroke();
      p.rect(0, 0, p.width, p.height);
      fadeOpacity -= 20;
      if (fadeOpacity <= 0) {
        resetSketch();
        fadeOpacity = 255;
        isFading = false;
        resetTimer = null;
      }
      return;
    }

    if (totalMovement < 1) {
      if (!resetTimer) resetTimer = p.frameCount;
      else if (p.frameCount - resetTimer > 900) isFading = true;
    } else resetTimer = null;
  };

  // ----------------- Helpers -----------------
  function setupSliders(container) {
    const controls = p.createDiv().parent(container);
    controls.id("controls");
    controls.style("position", "absolute")
      .style("top", "10px")
      .style("left", "10px")
      .style("background", "rgba(0,0,0,0.5)")
      .style("padding", "10px")
      .style("border-radius", "8px")
      .style("color", "#fff")
      .style("font-family", "monospace")
      .style("z-index", "100");

    controls.child(p.createP("Particle Size"));
    sizeSlider = p.createSlider(0.5, 15, 1.5, 0.1).parent(controls);

    controls.child(p.createP("Trail Length"));
    trailSlider = p.createSlider(10, 100, 40, 1).parent(controls);

    controls.child(p.createP("Fade Speed"));
    fadeSlider = p.createSlider(0, 10, 10, 1).parent(controls);

    controls.child(p.createP("Speed Multiplier"));
    speedSlider = p.createSlider(0.1, 5, 1, 0.1).parent(controls);

    controls.child(p.createP("Number of Particles"));
    particleSlider = p.createSlider(100, 10000, 4000, 100).parent(controls);
  }

  function setupPalettes() {
    allColors = [
      [p.color(0), p.color(34,28,99), p.color(68,56,199), p.color(160,156,227)],
      [p.color(0), p.color(83,15,112), p.color(166,31,224), p.color(211,143,240)],
      [p.color(142,202,230), p.color(33,158,188), p.color(2,48,71), p.color(255,183,3), p.color(251,133,0)],
      [p.color(218,215,205), p.color(163,177,138), p.color(88,129,87), p.color(58,90,64), p.color(52,78,65)],
      [p.color(205,180,219), p.color(255,200,221), p.color(255,175,204), p.color(189,224,254), p.color(162,210,255)],
      [p.color(0), p.color(53,82,45), p.color(105,164,91), p.color(180,210,173)],
      [p.color(55,73,58), p.color(251,233,190), p.color(166,70,52), p.color(73,89,84), p.color(187,138,56)],
      [p.color(0), p.color(30,98,71), p.color(60,195,141), p.color(157,225,198)],
      [p.color(237,175,184), p.color(247,225,215), p.color(222,219,210), p.color(176,196,177), p.color(74,87,89)],
      [p.color(6,123,194), p.color(132,188,218), p.color(236,195,11), p.color(243,119,72), p.color(213,96,98)],
      [p.color(220,214,247), p.color(166,177,225), p.color(180,134,159), p.color(152,95,111), p.color(78,76,103)],
      [p.color(147,181,198), p.color(221,237,170), p.color(240,207,101), p.color(215,129,106), p.color(189,79,108)],
      [p.color(224,102,102), p.color(230,145,56), p.color(255,217,102), p.color(147,196,125), p.color(111,168,220)],
      [p.color(212,138,169), p.color(158,108,162), p.color(133,94,141), p.color(109,137,158), p.color(152,192,182)],
      [p.color(255,229,153), p.color(181,203,207), p.color(246,178,107), p.color(182,215,168), p.color(147,196,125)],
      [p.color(81,43,82), p.color(99,82,116), p.color(123,176,168), p.color(167,219,171), p.color(228,245,177)]
    ];
  }

  function nextPalette() {
    currentPaletteIndex = (currentPaletteIndex + 1) % allColors.length;
    currentPalette = allColors[currentPaletteIndex];
  }

  function resetSketch() {
    cols = Math.floor(p.width / scl);
    rows = Math.floor(p.height / scl);
    flowfield = new Array(cols * rows);

    let yoff = 0;
    for (let y = 0; y < rows; y++) {
      let xoff = 0;
      for (let x = 0; x < cols; x++) {
        let index = x + y * cols;
        let angle = p.noise(xoff, yoff) * p.TWO_PI * 3.5;
        let v = p5.Vector.fromAngle(angle);
        v.setMag(1);
        flowfield[index] = v;
        xoff += 0.1;
      }
      yoff += 0.1;
    }

    currentPaletteIndex = Math.floor(p.random(allColors.length));
    currentPalette = allColors[currentPaletteIndex];
    p.background(22, 22, 22);
    trailLayer.clear();

    particles = [];
    for (let i = 0; i < particleSlider.value(); i++) {
      particles.push(new Particle());
    }
  }

  class Particle {
    constructor() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.col = p.random(currentPalette);
      this.trail = [];
      this.maxLength = trailSlider.value();
    }

    update(flowfield) {
      let x = Math.floor(this.pos.x / scl);
      let y = Math.floor(this.pos.y / scl);
      let index = x + y * cols;
      let force = flowfield[index];
      if (force) {
        let prev = this.pos.copy();
        this.pos.add(p5.Vector.mult(force, speedSlider.value()));

        if (this.isOutOfBounds()) {
          nextPalette();
          this.reset();
          return 0;
        }

        this.trail.push(this.pos.copy());
        this.maxLength = trailSlider.value();
        if (this.trail.length > this.maxLength) this.trail.shift();
        return p5.Vector.dist(prev, this.pos);
      }
      return 0;
    }

    show(pg) {
      pg.noFill();
      pg.stroke(this.col);
      pg.strokeWeight(sizeSlider.value());
      pg.beginShape();
      for (let v of this.trail) pg.vertex(v.x, v.y);
      pg.endShape();
    }

    isOutOfBounds() {
      return this.pos.x < 0 || this.pos.x > p.width || this.pos.y < 0 || this.pos.y > p.height;
    }

    reset() {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.col = p.random(currentPalette);
      this.trail = [];
    }
  }

  p.keyPressed = () => {
    if (p.key === 'f' || p.key === 'F') {
      let fs = p.fullscreen();
      p.fullscreen(!fs);
      justWentFullscreen = true;
    }
    if (p.key === 'r' || p.key === 'R') resetSketch();
  };

  p.windowResized = () => {
    const container = document.getElementById(containerId);
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    trailLayer = p.createGraphics(container.offsetWidth, container.offsetHeight);
    if (justWentFullscreen) {
      resetSketch();
      justWentFullscreen = false;
    }
  };
};

// Attach to div
new p5(particleSketch);
