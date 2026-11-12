// "First draft" versions of the hand-made animations, as a beginner would build them from the same
// illustrations: only opacity/position/scale/rotation, everything linear, no trim paths, no overshoot.
// Each comp is first frozen in its final state, then gets the simple keys below, and is rendered at
// 50 fps as a transparent PNG sequence. Run it on a COPY of the project (PROJECT_COPY): opening the
// original and changing comps makes After Effects write auto-saves that rotate out old ones.
var PROJECT_COPY = "__COPY__";
var ORIGINAL = "__ORIGINAL__"; // reopened at the end so the user's session is back as it was
var OUT = "__OUT__";
var FPS = 50;
var renderLog = [];

function findComp(name) {
  for (var i = 1; i <= app.project.numItems; i++) {
    var c = app.project.item(i);
    if (c instanceof CompItem && c.name == name && !(c.width == 512 && c.height == 512) && c.parentFolder.name.indexOf("Layers") < 0) return c;
  }
}
function layer(c, name) {
  for (var l = 1; l <= c.numLayers; l++) if (c.layer(l).name == name) return c.layer(l);
  throw new Error("no layer " + name + " in " + c.name);
}
// remove every keyframe, keeping the value of the last one
function freeze(g) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p = g.property(i);
    if (p.propertyType == PropertyType.PROPERTY) {
      if (p.numKeys > 0) {
        var v = p.keyValue(p.numKeys);
        for (var k = p.numKeys; k >= 1; k--) p.removeKey(k);
        p.setValue(v);
      }
    } else freeze(p);
  }
}
function freezeComp(c) { for (var l = 1; l <= c.numLayers; l++) freeze(c.layer(l)); }
function tr(L, name) { return L.property("ADBE Transform Group").property(name); }
// keys: [[time, value], ...]; linear unless hold
function keys(prop, list, hold) {
  for (var i = 0; i < list.length; i++) prop.setValueAtTime(list[i][0], list[i][1]);
  var t = hold ? KeyframeInterpolationType.HOLD : KeyframeInterpolationType.LINEAR;
  for (var k = 1; k <= prop.numKeys; k++) {
    prop.setInterpolationTypeAtKey(k, t, t);
    if (prop.isSpatial && !hold) prop.setSpatialTangentsAtKey(k, [0, 0, 0], [0, 0, 0]);
  }
}
function fadeIn(L, t0, t1) { keys(tr(L, "ADBE Opacity"), [[t0, 0], [t1, 100]]); }
function slideIn(L, t0, t1, dx, dy) {
  var p = tr(L, "ADBE Position"), v = p.value;
  keys(p, [[t0, [v[0] + dx, v[1] + dy, v[2]]], [t1, v]]);
}
function growIn(L, t0, t1) { var s = tr(L, "ADBE Scale"), v = s.value; keys(s, [[t0, [0, 0, v[2]]], [t1, v]]); }

var RECIPES = {
  "rocks-glass": { seconds: 2.6, build: function (c) {
    // glass and liquid slide in together from the left, the rest fades in one after another
    var glass = layer(c, "glass Outlines"), liquid = layer(c, "liquid Outlines");
    slideIn(glass, 0, 1, -420, 0); slideIn(liquid, 0, 1, -420, 0);
    fadeIn(glass, 0, 0.3); fadeIn(liquid, 0, 0.3);
    fadeIn(layer(c, "ice cube Outlines"), 1.2, 1.6);
    fadeIn(layer(c, "deco Outlines"), 1.6, 2.0);
    var sv = layer(c, "star vertical 2 Outlines"), sh = layer(c, "star horizontal 2 Outlines");
    fadeIn(sv, 2.0, 2.3); fadeIn(sh, 2.0, 2.3);
  } },
  orange: { seconds: 3.1, build: function (c) {
    growIn(layer(c, "orange filling Outlines"), 0, 0.6);
    var order = ["orange boundary Outlines", "slice boundary Outlines", "slice line 1 Outlines", "slice line 2 Outlines",
      "slice line 3 Outlines", "slice line 4 Outlines", "leaf bottom Outlines", "leaf top Outlines", "leaf line Outlines"];
    for (var i = 0; i < order.length; i++) fadeIn(layer(c, order[i]), 0.6 + i * 0.25, 0.85 + i * 0.25);
    fadeIn(layer(c, "star vertical Outlines"), 2.8, 3.0); fadeIn(layer(c, "star horizontal Outlines"), 2.8, 3.0);
  } },
  shaker: { seconds: 2.3, build: function (c) {
    // whole shaker (Null 3 carries everything) drops in, stiff linear wobble, drops pop in
    slideIn(layer(c, "Null 3"), 0, 0.8, 0, -900);
    // wobble around the body's resting angle (its children are rotated relative to it)
    var rot = tr(layer(c, "bottle body Outlines"), "ADBE Rotate Z"), b = rot.value;
    keys(rot, [[0.8, b], [1.0, b - 12], [1.2, b + 12], [1.4, b - 12], [1.6, b]]);
    layer(c, "shine Outlines").enabled = false;
    keys(tr(layer(c, "drop big Outlines"), "ADBE Opacity"), [[0, 0], [1.7, 100]], true);
    keys(tr(layer(c, "drop small Outlines"), "ADBE Opacity"), [[0, 0], [1.9, 100]], true);
  } },
  logo: { seconds: 2.5, build: function (c) {
    fadeIn(layer(c, "outline Outlines"), 0, 0.5);
    var glass = ["glass Outlines", "liquid Outlines", "ice cube Outlines"];
    for (var i = 0; i < glass.length; i++) fadeIn(layer(c, glass[i]), 0.5, 1.0);
    fadeIn(layer(c, "moon Outlines"), 1.0, 1.3);
    var letters = ["a", "f", "t", "e", "r", "h", "o", "u", "r", "s"];
    for (var l = 1; l <= c.numLayers; l++) {
      var L = c.layer(l), n = L.name.replace(" Outlines", "");
      if (L.enabled && n.length == 1) { fadeIn(L, 1.3, 2.0); slideIn(L, 1.3, 2.0, 250, 0); }
      if (L.name.indexOf("star") == 0) L.enabled = false;
    }
  } },
  button: { seconds: 0.7, scale: 5, build: function (c) {
    // the classic first hover: the whole button gets bigger and back, no stars, no letter wave
    var s = tr(layer(c, "pill"), "ADBE Scale"), v = s.value;
    keys(s, [[0, v], [0.3, [v[0] * 1.12, v[1] * 1.12, v[2]]], [0.6, v]]);
    for (var l = 1; l <= c.numLayers; l++) if (c.layer(l).name.indexOf("star") == 0) c.layer(l).enabled = false;
  } }
};

function render(c, name, seconds, scale) {
  var target = c;
  if (scale > 1) {
    target = app.project.items.addComp("wrap", c.width * scale, c.height * scale, 1, c.duration, c.frameRate);
    var W = target.layers.add(c); W.collapseTransformation = true;
    tr(W, "ADBE Scale").setValue([100 * scale, 100 * scale]);
    tr(W, "ADBE Position").setValue([c.width * scale / 2, c.height * scale / 2]);
  }
  var d = new Folder(OUT + name); d.create();
  var n = Math.round(seconds * FPS);
  for (var f = 0; f < n; f++) target.saveFrameToPng(f / FPS, new File(d.fsName + "/" + ("000" + f).slice(-4) + ".png"));
  var last = new File(d.fsName + "/" + ("000" + (n - 1)).slice(-4) + ".png");
  for (var w = 0; w < 900 && !last.exists; w++) $.sleep(200);
  $.sleep(1000);
}

app.beginSuppressDialogs();
for (var name in RECIPES) {
  try {
    app.open(new File(PROJECT_COPY));
    var c = findComp(name), r = RECIPES[name];
    freezeComp(c);
    r.build(c);
    render(c, name + "-draft", r.seconds, r.scale || 1);
    renderLog.push(name + " ok");
  } catch (e) { renderLog.push(name + " ERR " + e.toString() + " line " + e.line); }
  app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
}
app.open(new File(ORIGINAL));
app.endSuppressDialogs(false);
var lf = new File(OUT + "render.log"); lf.open("w"); lf.write(renderLog.join("\n")); lf.close();
