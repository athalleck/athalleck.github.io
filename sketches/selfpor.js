let sketch1 = (p) => {
  let video;
  let bgImage;
  let backgroundCaptured = false;
  let showPoses = false;

  // HTML container id
  const containerId = "vcdm"; // change this to whichever div you want

  p.setup = () => {
    const container = document.getElementById(containerId);
    p.createCanvas(container.offsetWidth, container.offsetHeight).parent(container);

    // Initialize video capture
    video = p.createCapture(p.VIDEO, () => {
      console.log("Video capture started");
    });
    video.size(p.width, p.height);
    video.hide();

    // Capture background after 3 seconds
    setTimeout(() => {
      captureBackground();
      backgroundCaptured = true;
    }, 3000);
  };

  p.draw = () => {
    if (backgroundCaptured && bgImage) {
      p.image(bgImage, 0, 0, p.width, p.height);
    } else {
      p.background(255);
    }

    if (showPoses) {
      drawPoses();
    }
  };

  function captureBackground() {
    bgImage = video.get();
    abstractBackground();
  }

  function abstractBackground() {
    bgImage.filter(p.BLUR, 10);
    bgImage.filter(p.POSTERIZE, 3);
  }

  function drawPoses() {
    // Placeholder for pose drawing logic
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Pose display active", p.width / 2, p.height / 2);
  }

  p.keyPressed = () => {
    if (p.key === "P" || p.key === "p") {
      showPoses = !showPoses;
      console.log("Show poses:", showPoses);
    }
  };

  p.windowResized = () => {
    const container = document.getElementById(containerId);
    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
    if (video) {
      video.size(container.offsetWidth, container.offsetHeight);
    }
  };
};

// Attach to a div
new p5(sketch1);
