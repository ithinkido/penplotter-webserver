var machineWidthInput = document.getElementById("hpgl-machine-width");
var machineHeightInput = document.getElementById("hpgl-machine-height");
var hpgl;

var hpglViewer = new HPGLViewer({
  container: "hpgl-viewer-canvas",
  canvasWidth: 900, // in px
  machineTravelWidth: 416, // in mm
  machineTravelHeight: 259, // in mm
  machineRatio: 40
});

// Fetch the contents of the "c.hpgl" file
fetch('1.hpgl')
  .then(response => response.text())
  .then(data => {
    hpgl = data;
    hpglViewer.draw(hpgl);
  })
  .catch(error => console.error('Error fetching file:', error));

machineWidthInput.addEventListener("change", function(e) {
  hpglViewer.setMachineTravelWidth(e.target.value);
  if(hpgl) {
    hpglViewer.draw(hpgl);
  }
});

machineHeightInput.addEventListener("change", function(e) {
  hpglViewer.setMachineTravelHeight(e.target.value);
  if(hpgl) {
    hpglViewer.draw(hpgl);
  }
});
