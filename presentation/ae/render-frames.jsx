var D = '/Users/kromer/Documents/HFIAD/motion-design/abgabe/Comp/'
var jobs = [
  ['ame', D + 'abgabe.aep_AME/tmpAEtoAMEProject-shaker.aep', [['shaker', 'shaker-v1', 4]]],
  ['as11', D + 'Auto-Save/abgabe auto-save 11.aep', [['rocks-glass', 'rocks-glass-v1', 5.6]]],
  [
    'final',
    D + 'abgabe.aep',
    [
      ['shaker', 'shaker-final', 4],
      ['rocks-glass', 'rocks-glass-final', 4.2],
    ],
  ],
]
var log = []
app.beginSuppressDialogs()
try {
  for (var s = 2; s < jobs.length; s++) {
    var pr = app.open(new File(jobs[s][1]))
    for (var j = 0; j < jobs[s][2].length; j++) {
      var jb = jobs[s][2][j]
      for (var i = 1; i <= pr.numItems; i++) {
        var c = pr.item(i)
        if (!(c instanceof CompItem) || c.name != jb[0]) continue
        if (c.parentFolder.name.indexOf('Layers') >= 0 || c.width == 512) continue
        var dir = new Folder(
          '/private/tmp/claude-501/-Users-kromer-projects-after-hours/12a8b607-4b39-484f-9426-9ba90de07568/scratchpad/ae/frames/' +
            jb[1],
        )
        dir.create()
        var n = Math.round(jb[2] * 25)
        for (var f = 0; f <= n; f += 1) {
          var fn = ('000' + f).slice(-4)
          c.saveFrameToPng(f / 25, new File(dir.fsName + '/' + fn + '.png'))
        }
        log.push(jb[1] + ' ' + c.width + 'x' + c.height + ' frames=' + (n + 1))
      }
    }
  }
} catch (e) {
  log.push('ERR ' + e.toString() + ' line ' + e.line)
}
app.endSuppressDialogs(false)
$.sleep(3000)
var lf = new File(
  '/private/tmp/claude-501/-Users-kromer-projects-after-hours/12a8b607-4b39-484f-9426-9ba90de07568/scratchpad/ae/render.txt',
)
lf.open('w')
lf.write(log.join('\n'))
lf.close()
