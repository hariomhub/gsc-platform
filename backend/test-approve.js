import http from 'http';

const data = JSON.stringify({
  profile_badge: "Microsoft Lead"
});

const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/admin/users/1/approve',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  let body = '';
  res.on('data', d => {
    body += d;
  });
  res.on('end', () => {
    console.log(body);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
