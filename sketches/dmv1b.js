window.sketch1B = (p) => {
  const branchingFactor = 2;
  let noiseFactor = 80;
  let agentSpeed = 0;
  const agentArray = [];
  let world;
  let mic;

  p.setup = () => {
    const container = p.select("#drawing-machine-canvas");
    const w = container.width;
    const h = container.height;

    const cnv = p.createCanvas(w, h);
    cnv.parent(container);
    p.pixelDensity(1);
    p.stroke("black");
    p.background("white");
    p.noFill();
    p.noiseSeed();

    // Initialize mic safely
    try {
      mic = new p5.AudioIn();
      if (p.getAudioContext && p.getAudioContext().state === "suspended") {
        p.getAudioContext().resume().catch(() => {});
      }
      mic.start().catch(() => { mic = null; });
    } catch (e) {
      mic = null;
    }

    buildWorld();
  };

  function buildWorld() {
    p.background("white");
    world = array2d();
    agentArray.length = 0;
    agentArray.push(createAgent());
  }

  p.draw = () => {
    let vol = 0;
    if (mic && mic.getLevel) {
      try { vol = mic.getLevel(); } catch(e) { vol = 0; }
    }

    // Map volume to motion
    if (vol > 0) {
      noiseFactor = p.map(vol, 0, 0.3, 30, 200, true);
      agentSpeed = p.map(vol, 0, 0.3, 5, 150, true);
      agentSpeed = p.constrain(agentSpeed, 0, 150);
    } else {
      agentSpeed = 0; // stop agents when silent
    }

    // Advance agents
    if (agentSpeed > 0) {
      const maxIters = Math.min(agentSpeed, 500);
      for (let i = 0; i < maxIters; i++) {
        agentArray.slice().forEach((a, idx) => {
          try {
            const result = a.next();
            if (result.done) agentArray[idx] = createAgent();
          } catch (err) {
            agentArray[idx] = createAgent();
          }
        });
      }
    }

    // --- Debug overlay ---
    p.push();
    p.noStroke();
    p.fill(0, 150);
    p.rect(10, 10, 160, 50);
    p.fill(255);
    p.textSize(14);
    p.text(`Volume: ${vol.toFixed(4)}`, 20, 30);
    p.text(`Agent speed: ${agentSpeed.toFixed(1)}`, 20, 50);
    p.pop();
  };

  p.mouseClicked = () => buildWorld();

  p.windowResized = () => {
    const container = p.select("#drawing-machine-canvas");
    p.resizeCanvas(container.width, container.height);
    buildWorld();
  };

  function* createAgent() {
    let x = p.random(p.width);
    let y = p.random(p.height);
    let heading = 0;
    const stack = [{ x, y, heading }];
    world.set(x, y);

    while (stack.length) {
      let { x, y, heading } = stack.pop();
      const num = p.random() < branchingFactor ? 2 : 1;

      for (let i = 0; i < num; i++, heading += p.PI / 35) {
        let newX = x;
        let newY = y;
        let tries = 0;
        do {
          const n = p.noise(newX / p.width, newY / p.height) * noiseFactor;
          newX = (newX + p.cos(heading + n) + p.width) % p.width;
          newY = (newY + p.sin(heading + n) + p.height) % p.height;
          tries++;
          if (tries > 1000) break;
        } while (p.floor(newX) === p.floor(x) && p.floor(newY) === p.floor(y));

        if (!world.canMoveTo(newX, newY)) continue;
        stack.push({ x: newX, y: newY, heading });
        world.set(newX, newY);
        yield;
      }
    }
  }

  function array2d() {
    const array = Array.from({ length: p.width }, () => Array(p.height).fill(false));
    return {
      canMoveTo: (x, y) => array[p.floor(x)][p.floor(y)] === false,
      set: (x, y) => {
        array[p.floor(x)][p.floor(y)] = true;
        p.point(x + 0.5, y + 0.5);
      }
    };
  }

  p.keyPressed = () => {
    if (p.key === 'f' || p.key === 'F') {
      let fs = p.fullscreen();
      p.fullscreen(!fs);
      setTimeout(() => {
        p.resizeCanvas(p.select("#drawing-machine-canvas").width, p.select("#drawing-machine-canvas").height);
        buildWorld();
      }, 100);
    }

    if (p.key === 'r' || p.key === 'R') {
      buildWorld();
    }
  };
};
