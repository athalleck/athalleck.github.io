// sketches/dmv1.js
window.sketch1 = function(p) {
  const branchingFactor = 2;
  const noiseFactor = 80;
  const agentArray = [];
  const agentSpeed = 75;
  let world;

  p.setup = () => {
    const container = document.getElementById("drawing-machine-canvas");

    const w = container.clientWidth;
    const h = container.clientHeight;

    p.createCanvas(w, h).parent(container);

    p.noFill();
    building();
  };

  function building() {
    p.background("white");
    p.stroke("black");
    p.noFill();

    world = array2d();
    agentArray.length = 0;
    agentArray.push(agent());
  }

  p.mouseClicked = () => building();

  p.draw = () => {
    for (let i = 0; i < agentSpeed; i++) {
      agentArray.forEach((a) => a.next());
    }
  };

  function* agent() {
    let x = p.random(p.width);
    let y = p.random(p.height);
    let heading = 0;
    const stack = [{ x, y, heading }];
    world.set(x, y);

    while (stack.length) {
      let { x, y, heading } = stack.pop();

      const num = p.random() < branchingFactor ? 2 : 1;
      for (let i = 0; i < num; i++, heading += p.PI / 20) {
        let newX = x;
        let newY = y;
        let n;
        do {
          n = p.noise(newX / p.width, newY / p.height) * noiseFactor;
          newX = (newX + p.cos(heading + n) + p.width) % p.width;
          newY = (newY + p.sin(heading + n) + p.height) % p.height;
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
        p.rect(x, y, 1);
      },
    };
  }

  // Optional: resize canvas if window changes
  p.windowResized = () => {
    const container = document.getElementById("drawing-machine-canvas");
    p.resizeCanvas(container.clientWidth, container.clientHeight);
    building();
  };
};
