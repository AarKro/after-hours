// Renders "first draft" reconstructions (keys reduced to first/last, linear, stars hidden) and finals.
// Works on the comp in memory and closes without saving.
var PROJECT = '/Users/kromer/Documents/HFIAD/motion-design/abgabe/Comp/abgabe.aep'
var OUT =
  '/private/tmp/claude-501/-Users-kromer-projects-after-hours/12a8b607-4b39-484f-9426-9ba90de07568/scratchpad/ae/frames-drafts/'
var MICRO = /^star/
// [comp, frames, scale]
var COMPS = [
  ['orange', 100, 1],
  ['logo', 100, 1],
  ['button', 23, 5],
]
var log = []
function simplify(g) {
  for (var i = 1; i <= g.numProperties; i++) {
    var p = g.property(i)
    if (p.propertyType == PropertyType.PROPERTY) {
      if (p.numKeys > 2) {
        for (var k = p.numKeys - 1; k >= 2; k--) p.removeKey(k)
      }
      for (var k = 1; k <= p.numKeys; k++) {
        p.setInterpolationTypeAtKey(
          k,
          KeyframeInterpolationType.LINEAR,
          KeyframeInterpolationType.LINEAR,
        )
        if (
          p.propertyValueType == PropertyValueType.TwoD_SPATIAL ||
          p.propertyValueType == PropertyValueType.ThreeD_SPATIAL
        ) {
          try {
            var z = p.value.length == 3 ? [0, 0, 0] : [0, 0]
            p.setSpatialTangentsAtKey(k, z, z)
          } catch (e) {}
        }
      }
    } else simplify(p)
  }
}
function findComp(pr, name) {
  for (var i = 1; i <= pr.numItems; i++) {
    var c = pr.item(i)
    if (c instanceof CompItem && c.name == name && !(c.width == 512 && c.height == 512)) return c
  }
}
function render(c, name, n) {
  var d = new Folder(OUT + name)
  d.create()
  for (var f = 0; f < n; f++)
    c.saveFrameToPng(f / 25, new File(d.fsName + '/' + ('000' + f).slice(-4) + '.png'))
  var last = new File(d.fsName + '/' + ('000' + (n - 1)).slice(-4) + '.png')
  for (var w = 0; w < 600 && !last.exists; w++) $.sleep(200)
  $.sleep(1000)
}
app.beginSuppressDialogs()
try {
  for (var j = 0; j < COMPS.length; j++) {
    for (var v = 0; v < 2; v++) {
      var pr = app.open(new File(PROJECT))
      var c = findComp(pr, COMPS[j][0])
      if (v == 0) {
        for (var l = 1; l <= c.numLayers; l++) {
          var L = c.layer(l)
          simplify(L)
          if (MICRO.test(L.name)) L.enabled = false
        }
      }
      var sc = COMPS[j][2],
        target = c
      if (sc > 1) {
        target = pr.items.addComp('wrap', c.width * sc, c.height * sc, 1, c.duration, c.frameRate)
        var Ly = target.layers.add(c)
        Ly.collapseTransformation = true
        Ly.property('ADBE Transform Group')
          .property('ADBE Scale')
          .setValue([100 * sc, 100 * sc])
        Ly.property('ADBE Transform Group')
          .property('ADBE Position')
          .setValue([(c.width * sc) / 2, (c.height * sc) / 2])
      }
      render(target, COMPS[j][0] + (v == 0 ? '-draft' : '-final'), COMPS[j][1])
      log.push(COMPS[j][0] + ' ' + v + ' ok')
      app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES)
    }
  }
} catch (e) {
  log.push('ERR ' + e.toString() + ' line ' + e.line)
}
app.open(new File(PROJECT))
app.endSuppressDialogs(false)
var lf = new File(
  '/private/tmp/claude-501/-Users-kromer-projects-after-hours/12a8b607-4b39-484f-9426-9ba90de07568/scratchpad/ae/drafts.txt',
)
lf.open('w')
lf.write(log.join('\n'))
lf.close()
