var buffer_space = 0;
var buffer_size = 1;
var _buffer_space = new TimeSeries();

createTimeline();

function createTimeline() {
  var chart = new SmoothieChart({millisPerPixel:11,grid:{fillStyle:'#transparent',strokeStyle:'#transparent',borderVisible:false},labels:{fillStyle:'#fff',fontSize:15,precision:0},maxValue:buffer_size,minValue:0});
  chart.addTimeSeries(_buffer_space, {lineWidth:2,strokeStyle:'#fff',fillStyle:'#03a9f4'});
  chart.streamTo(document.getElementById("chart"), 500);
}