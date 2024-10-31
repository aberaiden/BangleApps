// Font for primary time and date
const primaryTimeFontSize = 5;
const primaryDateFontSize = 2;
const secondaryRowColFontSize = 2;

const xcol1 = 10;
const xcol2 = g.getWidth() - xcol1;

const font = "6x8";

const xyCenter = g.getWidth() / 2;
const yposTime = 43;
const yposDate = 75;
const yposWeek = 100;
const yposWorld = 130;


const OFFSET_TIME_ZONE = 0;
const OFFSET_HOURS = 1;

var offsets = require("Storage").readJSON("worldclock.settings.json") || [];

// timeout used to update every minute
var drawTimeout;

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function() {
    drawTimeout = undefined;
    draw();
  }, 60000 - (Date.now() % 60000));
}

function getCurrentTimeFromOffset(dt, offset) {
  return new Date(dt.getTime() + offset * 60 * 60 * 1000);
}

// Returns the ISO week of the date.
function getWeek() {
  var date = new Date();
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}

function drawBattery() {
  var s = 26;
  var t = 10; // thickness
  var x = 151, y = 0;
  //g.reset();
  //g.setColor(g.theme.fg);
  g.fillRect(x,y+2,x+s-4,y+2+t); // outer
  g.clearRect(x+2,y+2+2,x+s-4-2,y+2+t-2); // centre
  //g.setColor(g.theme.fg);
  //g.fillRect(x+s-3,y+2+(((t - 1)/2)-1),x+s-2,y+2+(((t - 1)/2)-1)+4); // contact
  g.setColor(0,0,255);
  g.fillRect(x+3, y+5, x +4 + E.getBattery()*(s-12)/100, y+t-1); // the level
}

function draw() {
  // get date
  var d = new Date();

  // default draw styles
  g.reset();

  // drawSting centered
  g.setFontAlign(0, 0);

  // draw time
  var time = require("locale").time(d, 1);
  g.setFont(font, primaryTimeFontSize);

  const fontHeight = g.getFontHeight();
  g.clearRect(0, yposTime - fontHeight / 2, g.getWidth(), yposTime + fontHeight / 2);
  g.drawString(`${time}`, xyCenter, yposTime, true);
  var month = require("locale").month(d, 1);
  //var dayweek = require("locale").dow(d, 1);
  var day = d.getDate();
  var week = getWeek();
  var date = [month, day].join(" ") + " (v" + week + ")";

  g.setFont(font, primaryDateFontSize);
  g.drawString(date, xyCenter, yposDate, true);

  // Box for Weekday
  //g.fillRect(4,85,25,102); // outer
  //g.clearRect(6,87,23,100); // centre

  g.setFont("4x6", 2);
  g.drawString("Mo                  ", xyCenter, yposWeek, false);
  g.drawString("   Tu               ", xyCenter, yposWeek, false);
  g.drawString("      Wd            ", xyCenter, yposWeek, false);
  g.drawString("         Th         ", xyCenter, yposWeek, false);
  g.drawString("            Fr      ", xyCenter, yposWeek, false);
  g.setColor(255,0,0);
  g.drawString("               Sa   ", xyCenter, yposWeek, false);
  g.drawString("                  Su", xyCenter, yposWeek, false);
  g.setColor(0,0,0);

  
  //BT Widget (Red = off, Green = advertising, Blue = connected)
  g.setFont("4x6",2);
  if (NRF.getSecurityStatus().advertising) {
    g.setColor(0,255,0);
  }
  else if (NRF.getSecurityStatus().connected) {
    g.setColor(0,0,255);
  } else {
    g.setColor(255,0,0);
  }
  g.drawString("BT", 15, 10, true);
  g.setColor(0,0,0);
  
  //g.setFont("6x8",2);
  //g.setColor(0,0,0);
  //g.drawString("Local", xyCenter, 10, true);


  // set gmt to UTC+0
  var gmt = new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000);

  // Loop through offset(s) and render
  offsets.forEach((offset, index) => {
    const dx = getCurrentTimeFromOffset(gmt, offset[OFFSET_HOURS]);
    var time = require("locale").time(dx, 1);
    g.setFont(font, secondaryRowColFontSize);
    g.setFontAlign(-1, 0);
    g.drawString(
      offset[OFFSET_TIME_ZONE],
      xcol1,
      yposWorld + index * 15,
      true
    );
    g.setFontAlign(1, 0);
    g.drawString(time, xcol2, yposWorld + index * 15, true);
  });

  drawBattery();
  queueDraw();
}

// clean app screen
g.clear();
// Show launcher when button pressed
Bangle.setUI("clock");
//Bangle.loadWidgets();
//Bangle.drawWidgets();

Bangle.http("https://pur3.co.uk/hello.txt").then(data=>{
  g.drawString(data.resp, 10, 20, true);
});

Bangle.setPollInterval(4000);
Bangle.accelWr(0x18,0x0A);

// draw now
draw();
