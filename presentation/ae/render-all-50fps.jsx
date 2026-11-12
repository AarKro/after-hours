// Renders every draft/final pair for the comparison slides at 50 fps as transparent PNG sequences.
// Point D/PROJECT at a COPY of the project folder: opening the originals and changing comps in memory
// makes After Effects write new auto-saves, and its rotation deletes the oldest ones.
// Opens each project, changes comps in memory only and closes without saving; reopens the final
// project at the end. Paths: OUT (frames), PROJECT (final), and the snapshots below.
// Drafts: "real" = an earlier version from an auto-save; "draft" = reconstructed from the final comp
// (keys cut to first/last, linear, stars hidden); "draft-keep" = same but all keys kept.
var D = "/Users/kromer/Documents/HFIAD/motion-design/abgabe/Comp/";
var PROJECT = D + "abgabe.aep";
var OUT = $.getenv("AH_OUT") || "~/after-hours-frames/";
var AI_SNAPSHOT = $.getenv("AH_SNAP13"); // copy of auto-save 13 (static "bar" comp)
var AI_BUILD = $.getenv("AH_BUILD"); // build.jsx replayed from the Claude Code session
var FPS = 50;
var JOBS = [
  // [output name, project, comp, mode, seconds, scale]
  ["rocks-glass-v1", D + "Auto-Save/abgabe auto-save 11.aep", "rocks-glass", "real", 5.6, 1],
  ["rocks-glass-final", PROJECT, "rocks-glass", "final", 4.2, 1],
  ["shaker-v1", D + "abgabe.aep_AME/tmpAEtoAMEProject-shaker.aep", "shaker", "real", 4.0, 1],
  ["shaker-final", PROJECT, "shaker", "final", 4.0, 1],
  ["orange-draft", PROJECT, "orange", "draft", 4.0, 1],
  ["orange-final", PROJECT, "orange", "final", 4.0, 1],
  ["logo-draft", PROJECT, "logo", "draft", 4.0, 1],
  ["logo-final", PROJECT, "logo", "final", 4.0, 1],
  ["button-draft", PROJECT, "button", "draft-keep", 0.88, 5],
  ["button-final", PROJECT, "button", "final", 0.88, 5],
  ["bar-intro-final", PROJECT, "bar-intro", "final", 5.2, 1],
  ["bar-intro-ai-draft", AI_SNAPSHOT, "bar-intro", "ai", 5.2, 1]
];
var MICRO = /^star/;
var renderLog = [];
function simplify(g, keepKeys) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p = g.property(i);
    if (p.propertyType == PropertyType.PROPERTY) {
      if (!keepKeys && p.numKeys > 2) for (var k = p.numKeys - 1; k >= 2; k--) p.removeKey(k);
      for (var k = 1; k <= p.numKeys; k++) {
        p.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        if (p.propertyValueType == PropertyValueType.TwoD_SPATIAL || p.propertyValueType == PropertyValueType.ThreeD_SPATIAL) {
          try { var z = p.value.length == 3 ? [0, 0, 0] : [0, 0]; p.setSpatialTangentsAtKey(k, z, z); } catch (e) {}
        }
      }
    } else simplify(p, keepKeys);
  }
}
function findComp(pr, name) {
  for (var i = 1; i <= pr.numItems; i++) {
    var c = pr.item(i);
    if (c instanceof CompItem && c.name == name && !(c.width == 512 && c.height == 512) && c.parentFolder.name.indexOf("Layers") < 0) return c;
  }
}
function render(c, name, n) {
  var d = new Folder(OUT + name); d.create();
  for (var f = 0; f < n; f++) c.saveFrameToPng(f / FPS, new File(d.fsName + "/" + ("000" + f).slice(-4) + ".png"));
  var last = new File(d.fsName + "/" + ("000" + (n - 1)).slice(-4) + ".png");
  for (var w = 0; w < 900 && !last.exists; w++) $.sleep(200);
  $.sleep(1000);
}
app.beginSuppressDialogs();
for (var j = 0; j < JOBS.length; j++) {
  var job = JOBS[j];
  try {
    var pr = app.open(new File(job[1]));
    if (job[3] == "ai") $.evalFile(new File(AI_BUILD));
    var c = findComp(app.project, job[2]);
    if (job[3] == "draft" || job[3] == "draft-keep") {
      for (var l = 1; l <= c.numLayers; l++) { var L = c.layer(l); simplify(L, job[3] == "draft-keep"); if (MICRO.test(L.name)) L.enabled = false; }
    }
    var target = c, sc = job[5];
    if (sc > 1) {
      target = app.project.items.addComp("wrap", c.width * sc, c.height * sc, 1, c.duration, c.frameRate);
      var Ly = target.layers.add(c); Ly.collapseTransformation = true;
      Ly.property("ADBE Transform Group").property("ADBE Scale").setValue([100 * sc, 100 * sc]);
      Ly.property("ADBE Transform Group").property("ADBE Position").setValue([c.width * sc / 2, c.height * sc / 2]);
    }
    render(target, job[0], Math.round(job[4] * FPS));
    renderLog.push(job[0] + " ok " + target.width + "x" + target.height);
  } catch (e) { renderLog.push(job[0] + " ERR " + e.toString() + " line " + e.line); }
  app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
}
app.open(new File(PROJECT));
app.endSuppressDialogs(false);
var lf = new File(OUT + "render.log"); lf.open("w"); lf.write(renderLog.join("\n")); lf.close();
