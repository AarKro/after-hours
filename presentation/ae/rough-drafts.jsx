// "First draft" versions derived from the finished animations: the core motion is there, the polish
// is not. Every property is set to linear keyframes (curves "off"); properties listed in KEEP keep all
// their keys (the core motion, e.g. the shake or the pour), every other animated property keeps only its first and
// last key (no overshoot, no wobble, no bounce). Layers listed in HIDE are switched off, and STAGGER
// makes staggered layers start together. Run on a COPY of the project, never the original.
var PROJECT_COPY = "__COPY__";
var ORIGINAL = "__ORIGINAL__";
var OUT = "__OUT__";
var FPS = 50;
var renderLog = [];

// Rocks glass, orange and shaker drafts are comps in the project now ("<name>-draft"); the logo has none.
var DRAFTS = {
  button: { seconds: 0.88, scale: 5, keep: [/^letter .*Position/], hide: [/^star/] }
};

function findComp(name) {
  for (var i = 1; i <= app.project.numItems; i++) {
    var c = app.project.item(i);
    if (c instanceof CompItem && c.name == name && !(c.width == 512 && c.height == 512) && c.parentFolder.name.indexOf("Layers") < 0) return c;
  }
}
function matches(list, s) { for (var i = 0; i < list.length; i++) if (list[i].test(s)) return true; return false; }
// Layers set to auto-orient rotate along their motion path: changing a position path would change
// their angle (the shaker parts would no longer fit together), so their position keys and path stay.
function rough(g, path, keep, layer) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p = g.property(i), n = path + "/" + p.name;
    if (p.propertyType == PropertyType.PROPERTY) {
      if (p.numKeys == 0) continue;
      var oriented = p.matchName == "ADBE Position" && layer.autoOrient != AutoOrientType.NO_AUTO_ORIENT;
      var keepAll = oriented || matches(keep, n);
      if (!keepAll) for (var k = p.numKeys - 1; k >= 2; k--) p.removeKey(k);
      for (var k = 1; k <= p.numKeys; k++) {
        p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        // a kept path keeps its curves; a cut one becomes a straight line
        if (!keepAll && (p.propertyValueType == PropertyValueType.TwoD_SPATIAL || p.propertyValueType == PropertyValueType.ThreeD_SPATIAL)) {
          try { var z = p.value.length == 3 ? [0, 0, 0] : [0, 0]; p.setSpatialTangentsAtKey(k, z, z); } catch (e) {}
        }
      }
    } else rough(p, n, keep, layer);
  }
}
// shift every key of a layer by dt seconds
function shiftKeys(g, dt) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p = g.property(i);
    if (p.propertyType == PropertyType.PROPERTY) {
      if (p.numKeys == 0) continue;
      var ks = [];
      for (var k = 1; k <= p.numKeys; k++) ks.push([p.keyTime(k), p.keyValue(k)]);
      for (var k = p.numKeys; k >= 1; k--) p.removeKey(k);
      for (var k = 0; k < ks.length; k++) p.setValueAtTime(ks[k][0] + dt, ks[k][1]);
      for (var k = 1; k <= p.numKeys; k++) p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
    } else shiftKeys(p, dt);
  }
}
function firstKeyTime(g) {
  var t = 1e9;
  for (var i = 1; i <= g.numProperties; i++) {
    var p = g.property(i);
    if (p.propertyType == PropertyType.PROPERTY) { if (p.numKeys) t = Math.min(t, p.keyTime(1)); }
    else t = Math.min(t, firstKeyTime(p));
  }
  return t;
}
function render(c, name, seconds, scale) {
  var target = c;
  if (scale > 1) {
    target = app.project.items.addComp("wrap", c.width * scale, c.height * scale, 1, c.duration, c.frameRate);
    var W = target.layers.add(c); W.collapseTransformation = true;
    W.property("ADBE Transform Group").property("ADBE Scale").setValue([100 * scale, 100 * scale]);
    W.property("ADBE Transform Group").property("ADBE Position").setValue([c.width * scale / 2, c.height * scale / 2]);
  }
  var d = new Folder(OUT + name); d.create();
  var n = Math.round(seconds * FPS);
  for (var f = 0; f < n; f++) target.saveFrameToPng(f / FPS, new File(d.fsName + "/" + ("000" + f).slice(-4) + ".png"));
  var last = new File(d.fsName + "/" + ("000" + (n - 1)).slice(-4) + ".png");
  for (var w = 0; w < 900 && !last.exists; w++) $.sleep(200);
  $.sleep(1000);
}

app.beginSuppressDialogs();
for (var name in DRAFTS) {
  try {
    app.open(new File(PROJECT_COPY));
    var c = findComp(name), cfg = DRAFTS[name];
    // staggered layers all start with the first of them
    if (cfg.together) {
      var start = 1e9, group = [];
      for (var l = 1; l <= c.numLayers; l++) if (c.layer(l).enabled && cfg.together.test(c.layer(l).name)) { group.push(c.layer(l)); start = Math.min(start, firstKeyTime(c.layer(l))); }
      for (var g = 0; g < group.length; g++) shiftKeys(group[g], start - firstKeyTime(group[g]));
    }
    for (var l = 1; l <= c.numLayers; l++) {
      var L = c.layer(l);
      if (matches(cfg.hide, L.name)) L.enabled = false;
      rough(L, L.name, cfg.keep, L);
    }
    render(c, name + "-draft", cfg.seconds, cfg.scale || 1);
    renderLog.push(name + " ok");
  } catch (e) { renderLog.push(name + " ERR " + e.toString() + " line " + e.line); }
  app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
}
app.open(new File(ORIGINAL));
app.endSuppressDialogs(false);
var lf = new File(OUT + "render.log"); lf.open("w"); lf.write(renderLog.join("\n")); lf.close();
