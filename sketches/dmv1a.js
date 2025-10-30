// sketches/dmv1a.js
window.sketch1A = function (p) {
  const branchingFactor = 2;
  const TOTAL_TIME = 10000; // 10 seconds per session
  let startTime = 0;

  let noiseFactor = 80;
  let agentSpeed = 100;
  const agentArray = [];
  let world; // occupancy buffer
  let mic = null;
  let waitingForReset = false;

  const DEBUG = false;

  // ---------- fast occupancy buffer ----------
  function makeOccupancy(w, h) {
    const W = Math.max(1, Math.floor(w));
    const H = Math.max(1, Math.floor(h));
    const buf = new Uint8Array(W * H);
    return {
      width: W,
      height: H,
      idx: (x, y) => (Math.floor(y) * W + Math.floor(x)),
      canMoveTo: (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y);
        if (xi < 0 || yi < 0 || xi >= W || yi >= H) return false;
        return buf[yi * W + xi] === 0;
      },
      set: (x, y) => {
        const xi = Math.floor(x), yi = Math.floor(y);
        if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
        buf[yi * W + xi] = 1;
        p.point(xi + 0.5, yi + 0.5);
      },
    };
  }

  // ---------- agent generator ----------
  function* agent() {
    const x0 = p.random(p.width);
    const y0 = p.random(p.height);
    let heading0 = 0;
    const stack = [{ x: x0, y: y0, heading: heading0 }];
    world.set(x0, y0);

    while (stack.length) {
      let { x, y, heading } = stack.pop();

      const num = p.random() < branchingFactor ? 2 : 1;
      for (let i = 0; i < num; i++, (heading += p.PI / 35)) {
        let newX = x, newY = y;
        let tries = 0;
        do {
          let n = p.noise(newX / p.width, newY / p.height) * noiseFactor;
          newX = (newX + p.cos(heading + n) + p.width) % p.width;
          newY = (newY + p.sin(heading + n) + p.height) % p.height;
          tries++;
          if (tries > 1000) break; // safety
        } while (p.floor(newX) === p.floor(x) && p.floor(newY) === p.floor(y));

        if (!world.canMoveTo(newX, newY)) continue;
        stack.push({ x: newX, y: newY, heading });
        world.set(newX, newY);
        yield;
      }
    }
  }

  // ---------- build / reset world ----------
  function buildWorld() {
    const container = document.getElementById("drawing-machine-canvas");
    const w = Math.max(1, Math.floor(container.clientWidth || window.innerWidth));
    const h = Math.max(1, Math.floor(container.clientHeight || window.innerHeight));

    p.background("white");
    p.stroke("black");
    p.noFill();

    world = makeOccupancy(w, h);
    agentArray.length = 0;
    agentArray.push(agent());

    startTime = p.millis();

    if (DEBUG) console.log("buildWorld:", w, h);
  }

  // ---------- p.setup ----------
  p.setup = function () {
    const container = document.getElementById("drawing-machine-canvas");
    const w = Math.max(1, Math.floor(container.clientWidth || window.innerWidth));
    const h = Math.max(1, Math.floor(container.clientHeight || window.innerHeight));

    const cnv = p.createCanvas(w, h);
    cnv.parent(container);
    try { p.pixelDensity(1); } catch (e) {}

    p.stroke("black");
    p.background("white");
    p.noFill();

    try {
      mic = new p5.AudioIn();
      if (p.getAudioContext && p.getAudioContext().state === "suspended") {
        p.getAudioContext().resume().catch(() => {});
      }
      mic.start().catch(() => { mic = null; });
    } catch (e) { mic = null; }

    buildWorld();
  };

  p.windowResized = function () {
    const container = document.getElementById("drawing-machine-canvas");
    const w = Math.max(1, Math.floor(container.clientWidth || window.innerWidth));
    const h = Math.max(1, Math.floor(container.clientHeight || window.innerHeight));
    p.resizeCanvas(w, h);
    buildWorld();
  };

  // ---------- p.draw ----------
  p.draw = function () {
    // update noiseFactor & agentSpeed based on mic input
    let vol = 0;
    if (mic && typeof mic.getLevel === "function") {
      try { vol = mic.getLevel(); } catch (e) { vol = 0; }
    }
    noiseFactor = p.map(vol, 0, 1, 30, 200);
    agentSpeed = p.map(vol, 0, 1, 50, 150);

    // advance agents
    const maxIters = Math.min(agentSpeed, 500);
    for (let i = 0; i < maxIters; i++) {
      // iterate copy to avoid splice issues
      agentArray.slice().forEach((a) => {
        try { a.next(); } catch (err) { if (DEBUG) console.error(err); }
      });
    }

    // continuously spawn new agents for lively drawing
    if (agentArray.length < 3 && p.random() < 0.01) {
      agentArray.push(agent());
    }

    // reset after TOTAL_TIME
    if (!waitingForReset && p.millis() - startTime > TOTAL_TIME) {
      waitingForReset = true;
      setTimeout(() => {
        p.background("white");
        world = makeOccupancy(p.width, p.height);
        agentArray.length = 0;
        agentArray.push(agent());
        waitingForReset = false;
        startTime = p.millis();
      }, 4000);
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
};
