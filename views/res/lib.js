function GET(url, callback) {
  fetch(url)
  .then((resp) => resp.json())
  .then(function(data) {
    callback(data)
  })
}

function POST(url, data, callback) {
  fetch(url, {
    method: "POST",   
    body: encodeURI(data),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    }
  })
  .then(function(res){ return res.json(); })
  .then(function(data){ callback(data) })
}

function error(json) {
  Swal.fire({ 
    icon: 'error',
    title: 'Oops...',
    text: JSON.stringify(json)
 })
}
