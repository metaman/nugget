var fs = require('fs')
var http = require('http')
var nugget = require('../')
var path = require('path')
var test = require('tape')

var data = new Buffer('hello everybody I am the data');

var testServer = http.createServer(function(req, res) {
  if (req.method === 'HEAD') {
    res.setHeader('content-length', data.length)
    res.setHeader('accept-ranges', 'bytes')
    res.end()
  } else {
    var range = req.headers['range'].split('=').pop().split('-').map(function (s) {
      return parseInt(s, 10)
    })
    res.setHeader('content-length', range[1] - range[0])
    res.setHeader('content-range', range[0] + '-' + range[1] + '/' + data.length);
    res.end(data.slice(range[0], range[1]))
  }
})

var target = path.join(__dirname, 'foobar.html')
if (fs.existsSync(target)) fs.unlinkSync(target)

fs.writeFileSync(target, data.slice(0, 10))

testServer.listen(5000, function() {
  test('fetches rest of file', function(t) {
    nugget('http://localhost:5000/foobar.html', {dir: __dirname, resume: true}, function(err) {
      t.ok(fs.existsSync(target), 'downloaded file')
      t.equal(fs.statSync(target).size, data.length, 'file is complete');
      if (fs.existsSync(target)) fs.unlinkSync(target)
      t.end()
      testServer.close()
    })
  })
})
